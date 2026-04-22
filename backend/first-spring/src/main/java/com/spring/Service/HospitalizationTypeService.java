package com.spring.Service;

import com.spring.Enums.SoftDelete;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NoChangesDetected;
import com.spring.Exceptions.NotFound;
import com.spring.Models.HospitalizationType;
import com.spring.Repositories.HospitalizationTypeRepository;
import com.spring.Specifications.HospitalizationTypeSpecification;
import com.spring.dto.HospitalizationTypeResponseDTO;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HospitalizationTypeService {
    private final HospitalizationTypeRepository typeRepository;
    private final ModelMapper modelMapper;

    public HospitalizationTypeService(HospitalizationTypeRepository typeRepository, ModelMapper modelMapper){
        this.typeRepository = typeRepository;
        this.modelMapper = modelMapper;
    }

    //CREATE
    public void createType(HospitalizationType type){
        if (typeRepository.existsByTypeName(type.getTypeName())){
            throw new AlreadyExists("Type already exists");
        }

        typeRepository.save(type);
    }

    //READ & FILTER
    public Page<HospitalizationTypeResponseDTO> getTypes(SoftDelete typeStatus, Pageable pageable){
        Specification<HospitalizationType> filters = Specification
                .where(HospitalizationTypeSpecification.hasStatus(typeStatus));

        return typeRepository.findAll(filters, pageable)
                .map(hospitalizationType -> {
                    return modelMapper.map(hospitalizationType, HospitalizationTypeResponseDTO.class);
                });
    }

    //SEARCH
    public Page<HospitalizationTypeResponseDTO> searchTypes(String typeName, Pageable pageable){
        return typeRepository.searchByTypeNameContaining(typeName, pageable)
                .map(hospitalizationType -> {
                    return modelMapper.map(hospitalizationType, HospitalizationTypeResponseDTO.class);
                });
    }

    //DROPDOWN
    public List<HospitalizationTypeResponseDTO> typeDropdown(){
        return typeRepository.findAllByTypeStatusNot(SoftDelete.Archived)
                .stream()
                .map(hospitalizationType -> {
                    return modelMapper.map(hospitalizationType, HospitalizationTypeResponseDTO.class);
                })
                .toList();
    }

    //UPDATE
    public void updateType(int typeId, HospitalizationType type){
        HospitalizationType typeToUpdate = typeRepository.findById(typeId).orElseThrow(() -> new NotFound("Type not found"));

        if (type.getTypeName() != null && !type.getTypeName().isEmpty()){
            typeToUpdate.setTypeName(type.getTypeName());
        }

        typeToUpdate.setTypeStatus(typeToUpdate.getTypeStatus());
        typeRepository.save(typeToUpdate);
    }

    //ARCHIVE
    public void archiveType(int typeId){
        HospitalizationType typeToArchive = typeRepository.findById(typeId).orElseThrow(() -> new NotFound("Type not found"));

        if (typeToArchive.getTypeStatus().equals(SoftDelete.Archived)){
            throw new NoChangesDetected("Type is already archived");
        }

        typeToArchive.setTypeStatus(SoftDelete.Archived);
        typeRepository.save(typeToArchive);
    }

    //RESTORE
    public void restoreType(int typeId){
        HospitalizationType typeToRestore = typeRepository.findById(typeId).orElseThrow(() -> new NotFound("Type not found"));

        if (typeToRestore.getTypeStatus().equals(SoftDelete.Active)){
            throw new NoChangesDetected("Type is already active");
        }

        typeToRestore.setTypeStatus(SoftDelete.Active);
        typeRepository.save(typeToRestore);
    }
}
