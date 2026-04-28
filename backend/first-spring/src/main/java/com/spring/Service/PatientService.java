package com.spring.Service;

import com.spring.Enums.PatientStatus;
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
    private final LogsService logsService;

    public PatientService(PatientsRepository patientsRepository, ModelMapper modelMapper, LogsService logsService){
        this.patientsRepository = patientsRepository;
        this.modelMapper = modelMapper;
        this.logsService = logsService;
    }

    //READ & FILTER
    public Page<PatientResponseDTO> getPatients(PatientStatus patientStatus, Pageable pageable){
        Specification<Patients> filters = Specification
                .where(PatientSpecification.hasStatus(patientStatus));

        return patientsRepository.findAll(filters, pageable)
                .map(patients -> {
                    PatientResponseDTO patientDTO = modelMapper.map(patients, PatientResponseDTO.class);
                    patientDTO.setFullName(
                            patients.getLastName() + ", "
                                    + (patients.getMiddleName() == null ? "" : patients.getMiddleName())
                                    + patients.getLastName()
                    );
                    return patientDTO;
                });
    }

    //SEARCH AND PAGINATED
    public Page<PatientResponseDTO> searchPatients(String name, Pageable pageable){
        return patientsRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(name, name, pageable)
                .map(patients -> {
                    PatientResponseDTO patientDTO = modelMapper.map(patients, PatientResponseDTO.class);
                    patientDTO.setFullName(
                            patients.getLastName() + ", "
                            + (patients.getMiddleName() == null ? "" : patients.getMiddleName())
                            + patients.getLastName()
                    );
                    return patientDTO;
                });
    }


    //SEARCH UNPAGINATED
    public List<PatientResponseDTO> SearchPatient(String name){
        return patientsRepository.findByNameContainingAndStatusNot(name, PatientStatus.Archived)
                .stream()
                .map(patients -> {
                    PatientResponseDTO patientDTO = modelMapper.map(patients, PatientResponseDTO.class);
                    patientDTO.setFullName(
                            patients.getLastName() + ", "
                                    + (patients.getMiddleName() == null ? "" : patients.getMiddleName())
                                    + patients.getLastName()
                    );
                    return patientDTO;
                })
                .toList();
    }
    //UPDATE
    public void updatePatient(int patientId, Patients patient){
        Patients patientToUpdate = patientsRepository.findById(patientId).orElseThrow(() -> new NotFound("Patient not found"));

        if (patient.getFirstName() != null && !patient.getFirstName().isEmpty()){
            patientToUpdate.setFirstName(patient.getFirstName());
        }

        if (patient.getMiddleName() != null){
            patientToUpdate.setMiddleName(patient.getMiddleName());
        }

        if (patient.getLastName() != null && !patient.getLastName().isEmpty()){
            if (patientsRepository.existsByFirstNameAndLastNameAndPatientIdNot(
                    patient.getFirstName() != null ? patient.getFirstName() : patientToUpdate.getFirstName(),
                    patient.getLastName(),
                    patientId)){
                throw new AlreadyExists("Patient already exists");
            }
            patientToUpdate.setLastName(patient.getLastName());
        }

        if (patient.getAddress() != null && !patient.getAddress().isEmpty()){
            patientToUpdate.setAddress(patient.getAddress());
        }

        if (patient.getContactNumber() != null && !patient.getContactNumber().isEmpty()){
            if (patient.getContactNumber().length() < 11){
                throw new NotAllowed("Contact number must be 11 digits");
            }
            if (patientsRepository.existsByContactNumberAndPatientIdNot(patient.getContactNumber(), patientId)){
                throw new AlreadyExists("Contact number already exists");
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

        String fullName = patientToUpdate.getLastName() + ", "
                + patientToUpdate.getFirstName() + " "
                + (patientToUpdate.getMiddleName() == null ? "" : patientToUpdate.getMiddleName());

        logsService.log("Patient Information Updated", "updated the information of " + fullName);
        patientsRepository.save(patientToUpdate);
    }

    //ARCHIVE
    public void archivePatient(int patientId){
        Patients patientToArchive = patientsRepository.findById(patientId).orElseThrow(() -> new NotFound("Patient not found"));

        if (patientToArchive.getStatus().equals(PatientStatus.Archived)){
            throw new NoChangesDetected("Patient is already archived");
        }

        String fullName = patientToArchive.getLastName() + ", "
                + patientToArchive.getFirstName() + " "
                + (patientToArchive.getMiddleName() == null ? "" : patientToArchive.getMiddleName());

        patientToArchive.setStatus(PatientStatus.Archived);
        logsService.log("Patient Archived", "archived patient " + fullName);
        patientsRepository.save(patientToArchive);
    }

    //RESTORE
    public void restorePatient(int patientId){
        Patients patientToArchive = patientsRepository.findById(patientId).orElseThrow(() -> new NotFound("Patient not found"));

        if (patientToArchive.getStatus().equals(PatientStatus.Active)){
            throw new NoChangesDetected("Patient is already active");
        }

        String fullName = patientToArchive.getLastName() + ", "
                + patientToArchive.getFirstName() + " "
                + (patientToArchive.getMiddleName() == null ? "" : patientToArchive.getMiddleName());

        patientToArchive.setStatus(PatientStatus.Active);
        logsService.log("Patient Restored", "restored patient " + fullName);
        patientsRepository.save(patientToArchive);
    }
}
