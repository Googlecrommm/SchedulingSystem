package com.spring.Service;

import com.spring.Enums.PatientStatus;
import com.spring.Enums.SoftDelete;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NoChangesDetected;
import com.spring.Exceptions.NotAllowed;
import com.spring.Exceptions.NotFound;
import com.spring.Models.Patients;
import com.spring.Repositories.PatientsRepository;
import com.spring.Specifications.PatientSpecification;
import com.spring.dto.PatientResponseDTO;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PatientService {
    private final PatientsRepository patientsRepository;
    private final ModelMapper modelMapper;

    public PatientService(PatientsRepository patientsRepository, ModelMapper modelMapper){
        this.patientsRepository = patientsRepository;
        this.modelMapper = modelMapper;
    }

    //READ & FILTER
    public Page<PatientResponseDTO> getPatients(PatientStatus patientStatus, Pageable pageable){
        Specification<Patients> filters = Specification
                .where(PatientSpecification.hasStatus(patientStatus));

        return patientsRepository.findAll(filters, pageable)
                .map(patients -> {
                    return modelMapper.map(patients, PatientResponseDTO.class);
                });
    }

    //SEARCH AND PAGINATED
    public Page<PatientResponseDTO> searchPatients(String name, Pageable pageable){
        return patientsRepository.searchByNameContaining(name, pageable)
                .map(patients -> {
                    return modelMapper.map(patients, PatientResponseDTO.class);
                });
    }

    //SEARCH UNPAGINATED
    public List<PatientResponseDTO> SearchPatient(String name){
        return patientsRepository.searchByNameContaining(name)
                .stream()
                .map(patients -> {
                    return modelMapper.map(patients, PatientResponseDTO.class);
                })
                .toList();
    }

    //UPDATE
    public void updatePatient(int patientId, Patients patient){
        Patients patientToUpdate = patientsRepository.findById(patientId).orElseThrow(() -> new NotFound("Patient not found"));
        if (patient.getName() != null && !patient.getName().isEmpty()){
            if (patientsRepository.existsByName(patient.getName())){
                throw new AlreadyExists("Patient already exists");
            }
            patientToUpdate.setName(patient.getName());
        }

        if (patient.getAddress() != null && !patient.getAddress().isEmpty()){
            patientToUpdate.setAddress(patient.getAddress());
        }

        if (patient.getContactNumber() != null && !patient.getContactNumber().isEmpty()){
            if (patient.getContactNumber().length() < 11){
                throw new NotAllowed("Contact number must be 11 digits");
            }
            patientToUpdate.setContactNumber(patient.getContactNumber());
        }

        if (patient.getBirthDate() != null){
            patientToUpdate.setBirthDate(patient.getBirthDate());
        }

        if (patient.getSex() != null){
            patientToUpdate.setSex(patient.getSex());
        }

        patientToUpdate.setStatus(patientToUpdate.getStatus());

        patientsRepository.save(patientToUpdate);

    }

    //ARCHIVE
    public void archivePatient(int patientId){
        Patients patientToArchive = patientsRepository.findById(patientId).orElseThrow(() -> new NotFound("Patient not found"));

        if (patientToArchive.getStatus().equals(PatientStatus.Archived)){
            throw new NoChangesDetected("Patient is already archived");
        }

        patientToArchive.setStatus(PatientStatus.Archived);
        patientsRepository.save(patientToArchive);
    }

    //RESTORE
    public void restorePatient(int patientId){
        Patients patientToArchive = patientsRepository.findById(patientId).orElseThrow(() -> new NotFound("Patient not found"));

        if (patientToArchive.getStatus().equals(PatientStatus.Active)){
            throw new NoChangesDetected("Patient is already active");
        }

        patientToArchive.setStatus(PatientStatus.Active);
        patientsRepository.save(patientToArchive);
    }
}
