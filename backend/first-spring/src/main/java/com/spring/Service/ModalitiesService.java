package com.spring.Service;

import com.spring.Exceptions.AlreadyExists;
import com.spring.Models.Modalities;
import com.spring.Repositories.ModalitiesRepository;
import org.springframework.stereotype.Service;

@Service
public class ModalitiesService {
    private final ModalitiesRepository modalitiesRepository;

    public ModalitiesService(ModalitiesRepository modalitiesRepository){
        this.modalitiesRepository = modalitiesRepository;
    }

    //CREATE
    public Modalities createModality(Modalities modality){
        if (modalitiesRepository.existsByModality(modality.getModality())){
            throw new AlreadyExists("This modality already exists");
        }

        return modalitiesRepository.save(modality);
    }
}
