package com.spring.Service;

import com.spring.Enums.SoftDelete;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NoChangesDetected;
import com.spring.Exceptions.NotAllowed;
import com.spring.Exceptions.NotFound;
import com.spring.Models.Modalities;
import com.spring.Models.Users;
import com.spring.Repositories.ModalitiesRepository;
import com.spring.Specifications.ModalitySpecification;
import com.spring.dto.ModalityResponseDTO;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ModalitiesService {
    private final ModalitiesRepository modalitiesRepository;
    private final ModelMapper modelMapper;

    public ModalitiesService(ModalitiesRepository modalitiesRepository, ModelMapper modelMapper) {
        this.modalitiesRepository = modalitiesRepository;
        this.modelMapper = modelMapper;
    }

    // ─── Reusable DTO mapping helper ────────────────────────────────────────────
    private ModalityResponseDTO mapToDTO(Modalities modalities) {
        ModalityResponseDTO modalityDTO = modelMapper.map(modalities, ModalityResponseDTO.class);
        modalityDTO.setDepartmentName(modalities.getDepartment().getDepartmentName());
        return modalityDTO;
    }

    // ─── Admin bypasses department check; frontdesk is scoped to their department ─
    private void validateModalityBelongsToDepartment(Modalities modality, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return;

        Users user = (Users) authentication.getPrincipal();

        if (user.getRole() == null || user.getRole().getDepartment() == null) {
            throw new NotAllowed("You are not assigned to any department.");
        }

        String userDept = user.getRole().getDepartment().getDepartmentName();
        String modalityDept = modality.getDepartment().getDepartmentName();

        if (!userDept.equalsIgnoreCase(modalityDept)) {
            throw new NotAllowed(
                    "You can only manage modalities within your department (" + userDept + ")."
            );
        }
    }

    //CREATE — admin must provide department, frontdesk auto-assigned
    public Modalities createModality(Modalities modality, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            if (modality.getDepartment() == null || modality.getDepartment().getDepartmentId() == 0) {
                throw new NotAllowed("Department is required.");
            }
        } else {
            Users user = (Users) authentication.getPrincipal();
            if (user.getRole() == null || user.getRole().getDepartment() == null) {
                throw new NotAllowed("You are not assigned to any department.");
            }
            modality.setDepartment(user.getRole().getDepartment());
        }

        if (modalitiesRepository.existsByModalityNameIgnoreCaseAndDepartment_DepartmentId(
                modality.getModalityName(), modality.getDepartment().getDepartmentId())) {
            throw new AlreadyExists("This modality already exists in this department.");
        }

        return modalitiesRepository.save(modality);
    }

    //READ & FILTER — departmentName null = admin sees all, non-null = scoped
    public Page<ModalityResponseDTO> getModalities(String modalityStatus, String departmentName, Pageable pageable) {
        Specification<Modalities> filters = Specification
                .where(ModalitySpecification.hasStatus(modalityStatus))
                .and(ModalitySpecification.hasDepartment(departmentName));

        return modalitiesRepository.findAll(filters, pageable).map(this::mapToDTO);
    }

    //SEARCH — scoped by department for non-admins
    public Page<ModalityResponseDTO> searchModality(String searchModality, String departmentName, Pageable pageable) {
        Specification<Modalities> filters = Specification
                .where(ModalitySpecification.hasDepartment(departmentName)) // ADDED
                .and((root, query, cb) ->
                        cb.like(cb.lower(root.get("modalityName")),
                                "%" + searchModality.toLowerCase() + "%"));

        return modalitiesRepository.findAll(filters, pageable).map(this::mapToDTO);
    }

    //DROPDOWN — admin gets all, department user gets only their department
    public List<ModalityResponseDTO> modalityDropdown(String departmentName) {
        if (departmentName == null) {
            // Admin — all active modalities across all departments
            return modalitiesRepository.findAllByModalityStatusNot(SoftDelete.Archived)
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }
        // Department user — only active modalities in their department
        return modalitiesRepository
                .findAllByModalityStatusNotAndDepartment_DepartmentNameIgnoreCase(
                        SoftDelete.Archived, departmentName)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    //UPDATE
    public void updateModality(int modalityId, Modalities modality, Authentication authentication) {
        Modalities modalityToUpdate = modalitiesRepository.findById(modalityId)
                .orElseThrow(() -> new NotFound("Modality not found"));

        validateModalityBelongsToDepartment(modalityToUpdate, authentication);

        if (modality.getModalityName() != null && !modality.getModalityName().isEmpty()) {
            if (modalitiesRepository.existsByModalityNameIgnoreCaseAndDepartment_DepartmentIdAndModalityIdNot(
                    modality.getModalityName(), modalityToUpdate.getDepartment().getDepartmentId(), modalityId)) {
                throw new AlreadyExists("Modality already exists in this department.");
            }
            modalityToUpdate.setModalityName(modality.getModalityName());
        }

        if (modality.getDepartment() != null) {
            modalityToUpdate.setDepartment(modality.getDepartment());
        }

        modalitiesRepository.save(modalityToUpdate);
    }

    //ARCHIVE
    public void archiveModality(int modalityId, Authentication authentication) {
        Modalities modalityToArchive = modalitiesRepository.findById(modalityId)
                .orElseThrow(() -> new NotFound("Modality not found"));

        validateModalityBelongsToDepartment(modalityToArchive, authentication);

        if (modalityToArchive.getModalityStatus().equals(SoftDelete.Archived)) {
            throw new NoChangesDetected("This modality is already archived");
        }

        modalityToArchive.setModalityStatus(SoftDelete.Archived);
        modalitiesRepository.save(modalityToArchive);
    }

    //RESTORE
    public void restoreModality(int modalityId, Authentication authentication) {
        Modalities modalityToRestore = modalitiesRepository.findById(modalityId)
                .orElseThrow(() -> new NotFound("Modality not found"));

        validateModalityBelongsToDepartment(modalityToRestore, authentication);

        if (modalityToRestore.getModalityStatus().equals(SoftDelete.Active)) {
            throw new NoChangesDetected("This modality is already active");
        }

        modalityToRestore.setModalityStatus(SoftDelete.Active);
        modalitiesRepository.save(modalityToRestore);
    }
}