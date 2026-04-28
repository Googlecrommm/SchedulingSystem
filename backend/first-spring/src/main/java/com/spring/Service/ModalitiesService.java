package com.spring.Service;

import com.spring.Enums.SoftDelete;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NoChangesDetected;
import com.spring.Exceptions.NotFound;
import com.spring.Models.Modalities;
import com.spring.Repositories.ModalitiesRepository;
import com.spring.Specifications.ModalitySpecification;
import com.spring.dto.ModalityResponseDTO;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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

    //CREATE
    public Modalities createModality(Modalities modality) {
        if (modalitiesRepository.existsByModalityName(modality.getModalityName())) {
            throw new AlreadyExists("This modality already exists");
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

    //UPDATE — admin only
    public void updateModality(int modalityId, Modalities modality) {
        Modalities modalityToUpdate = modalitiesRepository.findById(modalityId)
                .orElseThrow(() -> new NotFound("Modality not found"));

        if (modalitiesRepository.existsByModalityName(modality.getModalityName())) {
            throw new AlreadyExists("Modality already exists");
        }

        if (modality.getModalityName() != null && !modality.getModalityName().isEmpty()) {
            modalityToUpdate.setModalityName(modality.getModalityName());
        }

        if (modality.getDepartment() != null) {
            modalityToUpdate.setDepartment(modality.getDepartment());
        }

        modalityToUpdate.setModalityStatus(modalityToUpdate.getModalityStatus());
        modalitiesRepository.save(modalityToUpdate);
    }

    //ARCHIVE — admin only
    public void archiveModality(int modalityId) {
        Modalities modalityToArchive = modalitiesRepository.findById(modalityId)
                .orElseThrow(() -> new NotFound("Modality not found"));

        if (modalityToArchive.getModalityStatus().equals(SoftDelete.Archived)) {
            throw new NoChangesDetected("This modality is already archived");
        }

        modalityToArchive.setModalityStatus(SoftDelete.Archived);
        modalitiesRepository.save(modalityToArchive);
    }

    //RESTORE — admin only
    public void restoreModality(int modalityId) {
        Modalities modalityToRestore = modalitiesRepository.findById(modalityId)
                .orElseThrow(() -> new NotFound("Modality not found"));

        if (modalityToRestore.getModalityStatus().equals(SoftDelete.Active)) {
            throw new NoChangesDetected("This modality is already active");
        }

        modalityToRestore.setModalityStatus(SoftDelete.Active);
        modalitiesRepository.save(modalityToRestore);
    }
}