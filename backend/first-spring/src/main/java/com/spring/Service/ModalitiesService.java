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

    public ModalitiesService(ModalitiesRepository modalitiesRepository, ModelMapper modelMapper){
        this.modalitiesRepository = modalitiesRepository;
        this.modelMapper = modelMapper;
    }

    //CREATE
    public Modalities createModality(Modalities modality){
        if (modalitiesRepository.existsByModalityName(modality.getModalityName())){
            throw new AlreadyExists("This modality already exists");
        }

        return modalitiesRepository.save(modality);
    }

    //READ ALL
    public Page<ModalityResponseDTO> getModalities(String modalityStatus, String departmentName, Pageable pageable){
        Specification<Modalities> filters = Specification
                .where(ModalitySpecification.hasStatus(modalityStatus))
                .and(ModalitySpecification.hasDepartment(departmentName));

        return modalitiesRepository.findAll(filters, pageable)
                .map(modalities -> {
                    ModalityResponseDTO modalityDTO = modelMapper.map(modalities, ModalityResponseDTO.class);
                    modalityDTO.setDepartmentName(modalities.getDepartment().getDepartmentName());
                    return modalityDTO;
                });
    }

    //SEARCH MODALITY
    public Page<ModalityResponseDTO> searchModality(String searchModality, Pageable pageable){
        return modalitiesRepository.searchByModalityNameContaining(searchModality, pageable)
                .map(modalities -> {
                    ModalityResponseDTO modalityDTO = modelMapper.map(modalities, ModalityResponseDTO.class);
                    modalityDTO.setDepartmentName(modalities.getDepartment().getDepartmentName());
                    return modalityDTO;
                });
    }

    //MODALITY DROPDOWN
    public List<ModalityResponseDTO> modalityDropdown(){
        return modalitiesRepository.findAllByModalityStatusNot(SoftDelete.Archived)
                .stream()
                .map(modalities -> {
                    ModalityResponseDTO modalityDTO = modelMapper.map(modalities, ModalityResponseDTO.class);
                    modalityDTO.setDepartmentName(modalities.getDepartment().getDepartmentName());
                    return modalityDTO;
                })
                .toList();
    }

    //UPDATE
    public void updateModality(int modalityId, Modalities modality){
        Modalities modalityToUpdate = modalitiesRepository.findById(modalityId).orElseThrow(() -> new NotFound("Modality not found"));

        if (modality.getModalityName() != null && !modality.getModalityName().isEmpty()){
            modalityToUpdate.setModalityName(modality.getModalityName());
        }

        if(modality.getDepartment() != null){
            modalityToUpdate.setDepartment(modality.getDepartment());
        }

        modalityToUpdate.setModalityStatus(modalityToUpdate.getModalityStatus());
        modalitiesRepository.save(modalityToUpdate);
    }

    //ARCHIVE
    public void archiveModality(int modalityId){
        Modalities modalityToArchive = modalitiesRepository.findById(modalityId).orElseThrow(() -> new NotFound("Modality Not found"));

        if (modalityToArchive.getModalityStatus().equals(SoftDelete.Archived)){
            throw new NoChangesDetected("This modality is already archived");
        }

        modalityToArchive.setModalityStatus(SoftDelete.Archived);
        modalitiesRepository.save(modalityToArchive);
    }

    //RESTORE
    public void restoreModality(int modalityId){
        Modalities modalityToRestore = modalitiesRepository.findById(modalityId).orElseThrow(() -> new NotFound("Modality Not Found"));

        if(modalityToRestore.getModalityStatus().equals(SoftDelete.Active)){
            throw new NoChangesDetected("This modality is already active");
        }

        modalityToRestore.setModalityStatus(SoftDelete.Active);
        modalitiesRepository.save(modalityToRestore);
    }
}
