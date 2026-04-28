package com.spring.Service;

import com.spring.Enums.DoctorStatus;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NoChangesDetected;
import com.spring.Exceptions.NotFound;
import com.spring.Models.Doctors;
import com.spring.Repositories.DoctorsRepository;
import com.spring.Specifications.DoctorSpecification;
import com.spring.dto.DoctorsResponseDTO;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DoctorService {
    private final DoctorsRepository doctorsRepository;
    private final ModelMapper modelMapper;

    public DoctorService(DoctorsRepository doctorsRepository, ModelMapper modelMapper){
        this.doctorsRepository = doctorsRepository;
        this.modelMapper = modelMapper;
    }

    //CREATE
    public void addDoctor(Doctors doctors){
        if (doctorsRepository.existsByFirstNameAndLastName(doctors.getFirstName(), doctors.getLastName())){
            throw new AlreadyExists("This doctor already exists");
        }
        doctorsRepository.save(doctors);
    }


    //READ & FILTER
    public Page<DoctorsResponseDTO> getDoctors(String availabilityStatus, String roleName, Pageable pageable){
        Specification<Doctors> filters = Specification
                .where(DoctorSpecification.hasStatus(availabilityStatus))
                .and(DoctorSpecification.hasRole(roleName));

        return doctorsRepository.findAll(filters, pageable)
                .map(doctors -> {
                    DoctorsResponseDTO doctorDTO = modelMapper.map(doctors, DoctorsResponseDTO.class);
                    doctorDTO.setFullName(doctors.getLastName() + ", "
                                    + (doctors.getMiddleName() == null ? "" : doctors.getMiddleName())
                                    + doctors.getFirstName());
                    doctorDTO.setRoleName(doctors.getRole().getRoleName());
                    return doctorDTO;
                });
    }

    //READ & FILTER (RADIOLOGIST)
    public Page<DoctorsResponseDTO> getRadiologist(String availabilityStatus, Pageable pageable){
        Specification<Doctors> filters = Specification
                .where(DoctorSpecification.hasStatus(availabilityStatus))
                .and(DoctorSpecification.hasRole("Radiologist"));

        return doctorsRepository.findAll(filters, pageable)
                .map(doctors -> {
                    DoctorsResponseDTO doctorDTO = modelMapper.map(doctors, DoctorsResponseDTO.class);
                    doctorDTO.setFullName(doctors.getLastName() + ", "
                            + (doctors.getMiddleName() == null ? "" : doctors.getMiddleName())
                            + doctors.getFirstName());
                    doctorDTO.setRoleName(doctors.getRole().getRoleName());
                    return doctorDTO;
                });
    }

    //READ & FILTER (PHYSICAL THERAPIST)
    public Page<DoctorsResponseDTO> getTherapist(String availabilityStatus, Pageable pageable){
        Specification<Doctors> filters = Specification
                .where(DoctorSpecification.hasStatus(availabilityStatus))
                .and(DoctorSpecification.hasRole("Physical Therapist"));

        return doctorsRepository.findAll(filters, pageable)
                .map(doctors -> {
                    DoctorsResponseDTO doctorDTO = modelMapper.map(doctors, DoctorsResponseDTO.class);
                    doctorDTO.setFullName(doctors.getLastName() + ", "
                            + (doctors.getMiddleName() == null ? "" : doctors.getMiddleName())
                            + doctors.getFirstName());
                    doctorDTO.setRoleName(doctors.getRole().getRoleName());
                    return doctorDTO;
                });
    }

    //SEARCH
    public Page<DoctorsResponseDTO> searchDoctor(String searchName, Pageable pageable){
        return doctorsRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(searchName, searchName, pageable)
                .map(doctors -> {
                    DoctorsResponseDTO doctorDTO = modelMapper.map(doctors, DoctorsResponseDTO.class);
                    doctorDTO.setFullName(doctors.getLastName() + ", "
                            + (doctors.getMiddleName() == null ? "" : doctors.getMiddleName())
                            + doctors.getFirstName());
                    doctorDTO.setRoleName(doctors.getRole().getRoleName());
                    return doctorDTO;
                });
    }

    //DROPDOWN (ALL DOCTORS)
    public List<DoctorsResponseDTO> doctorDropdown(){
        return doctorsRepository.findAllByAvailabilityStatusEquals(DoctorStatus.Available)
                .stream()
                .map(doctors -> {
                    DoctorsResponseDTO doctorDTO = modelMapper.map(doctors, DoctorsResponseDTO.class);
                    doctorDTO.setFullName(doctors.getLastName() + ", "
                            + (doctors.getMiddleName() == null ? "" : doctors.getMiddleName())
                            + doctors.getFirstName());
                    doctorDTO.setRoleName(doctors.getRole().getRoleName());
                    return doctorDTO;
                })
                .toList();
    }

    //DROPDOWN (PHYSICAL THERAPIST)
    public List<DoctorsResponseDTO> ptDropdown(){
        return doctorsRepository.findAllByAvailabilityStatusEqualsAndRole_RoleNameEqualsIgnoreCase(DoctorStatus.Available, "Physical Therapist")
                .stream()
                .map(doctors -> {
                    DoctorsResponseDTO doctorDTO = modelMapper.map(doctors, DoctorsResponseDTO.class);
                    doctorDTO.setFullName(doctors.getLastName() + ", "
                            + (doctors.getMiddleName() == null ? "" : doctors.getMiddleName())
                            + doctors.getFirstName());
                    doctorDTO.setRoleName(doctors.getRole().getRoleName());
                    return doctorDTO;
                })
                .toList();
    }

    //DROPDOWN (RADIOLOGIST)
    public List<DoctorsResponseDTO> radiologistDropdown(){
        return doctorsRepository.findAllByAvailabilityStatusEqualsAndRole_RoleNameEqualsIgnoreCase(DoctorStatus.Available, "Radiologist")
                .stream()
                .map(doctors -> {
                    DoctorsResponseDTO doctorDTO = modelMapper.map(doctors, DoctorsResponseDTO.class);
                    doctorDTO.setFullName(doctors.getLastName() + ", "
                            + (doctors.getMiddleName() == null ? "" : doctors.getMiddleName())
                            + doctors.getFirstName());
                    doctorDTO.setRoleName(doctors.getRole().getRoleName());
                    return doctorDTO;
                })
                .toList();
    }

    //UPDATE
    public void updateDoctor(int doctorId, Doctors doctor){
        Doctors doctorToUpdate = doctorsRepository.findById(doctorId).orElseThrow(() -> new NotFound("Doctor not found"));

        if (doctor.getFirstName() != null && !doctor.getFirstName().isEmpty()){
            doctorToUpdate.setFirstName(doctor.getFirstName());
        }

        if (doctor.getMiddleName() != null){
            doctorToUpdate.setMiddleName(doctor.getMiddleName());
        }

        if (doctor.getLastName() != null && !doctor.getLastName().isEmpty()){
            if (doctorsRepository.existsByFirstNameAndLastNameAndDoctorIdNot(
                    doctor.getFirstName() != null ? doctor.getFirstName() : doctorToUpdate.getFirstName(),
                    doctor.getLastName(),
                    doctorId)){
                throw new AlreadyExists("Doctor already exists");
            }
            doctorToUpdate.setLastName(doctor.getLastName());
        }

        if (doctor.getRole() != null){
            doctorToUpdate.setRole(doctor.getRole());
        }

        doctorToUpdate.setAvailabilityStatus(doctorToUpdate.getAvailabilityStatus());
        doctorsRepository.save(doctorToUpdate);
    }

    //MARK AS ON_LEAVE
    public void markLeave(int doctorId){
        Doctors doctorToLeave = doctorsRepository.findById(doctorId).orElseThrow(() -> new NotFound("Doctor not found"));

        if (doctorToLeave.getAvailabilityStatus().equals(DoctorStatus.On_Leave)){
            throw new NoChangesDetected("Doctor is already on leave");
        }

        doctorToLeave.setAvailabilityStatus(DoctorStatus.On_Leave);
        doctorsRepository.save(doctorToLeave);
    }

    //MARK AS UNAVAILABLE
    public void markUnavailable(int doctorId){
        Doctors doctorToUnavailable = doctorsRepository.findById(doctorId).orElseThrow(() -> new NotFound("Doctor not found"));

        if(doctorToUnavailable.getAvailabilityStatus().equals(DoctorStatus.Unavailable)){
            throw new NoChangesDetected("Doctor is already unavailable");
        }

        doctorToUnavailable.setAvailabilityStatus(DoctorStatus.Unavailable);
        doctorsRepository.save(doctorToUnavailable);
    }

    //MARK AS AVAILABLE
    public void markAvailable(int doctorId){
        Doctors doctorToAvailable = doctorsRepository.findById(doctorId).orElseThrow(() -> new NotFound("Doctor not found"));

        if (doctorToAvailable.getAvailabilityStatus().equals(DoctorStatus.Available)){
            throw new NoChangesDetected("Doctor is already available");
        }

        doctorToAvailable.setAvailabilityStatus(DoctorStatus.Available);
        doctorsRepository.save(doctorToAvailable);
    }

}
