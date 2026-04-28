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

    public DoctorService(DoctorsRepository doctorsRepository, ModelMapper modelMapper) {
        this.doctorsRepository = doctorsRepository;
        this.modelMapper = modelMapper;
    }

    // ─── Reusable DTO mapping helper ────────────────────────────────────────────
    private DoctorsResponseDTO mapToDTO(Doctors doctors) {
        DoctorsResponseDTO doctorDTO = modelMapper.map(doctors, DoctorsResponseDTO.class);
        doctorDTO.setFullName(doctors.getLastName() + ", "
                + (doctors.getMiddleName() == null ? "" : doctors.getMiddleName())
                + doctors.getFirstName());
        doctorDTO.setRoleName(doctors.getRole().getRoleName());
        return doctorDTO;
    }

    //CREATE
    public void addDoctor(Doctors doctors) {
        if (doctorsRepository.existsByFirstNameAndLastName(doctors.getFirstName(), doctors.getLastName())) {
            throw new AlreadyExists("This doctor already exists");
        }
        doctorsRepository.save(doctors);
    }

    //READ & FILTER — single method, handles all departments dynamically
    // departmentName = null → admin sees all departments
    // departmentName = "Radiology" → scoped to that department only
    public Page<DoctorsResponseDTO> getDoctors(String availabilityStatus, String roleName, String departmentName, Pageable pageable) {
        Specification<Doctors> filters = Specification
                .where(DoctorSpecification.hasStatus(availabilityStatus))
                .and(DoctorSpecification.hasRole(roleName))
                .and(DoctorSpecification.hasDepartment(departmentName)); // ADDED

        return doctorsRepository.findAll(filters, pageable).map(this::mapToDTO);
    }

    // DELETED: getRadiologist()  — replaced by getDoctors() with departmentName param
    // DELETED: getTherapist()    — replaced by getDoctors() with departmentName param

    //SEARCH — scoped by department for non-admins
    public Page<DoctorsResponseDTO> searchDoctor(String searchName, String departmentName, Pageable pageable) {
        Specification<Doctors> filters = Specification
                .where(DoctorSpecification.hasDepartment(departmentName)) // ADDED
                .and((root, query, cb) -> cb.or(
                        cb.like(cb.lower(root.get("firstName")), "%" + searchName.toLowerCase() + "%"),
                        cb.like(cb.lower(root.get("lastName")), "%" + searchName.toLowerCase() + "%")
                ));

        return doctorsRepository.findAll(filters, pageable).map(this::mapToDTO);
    }

    //DROPDOWN — single method replaces doctorDropdown, ptDropdown, radiologistDropdown
    // departmentName = null → admin gets all available doctors
    // departmentName = "Radiology" → gets only available doctors in that department
    public List<DoctorsResponseDTO> doctorDropdown(String departmentName) {
        if (departmentName == null) {
            // Admin — return all available doctors across all departments
            return doctorsRepository.findAllByAvailabilityStatusEquals(DoctorStatus.Available)
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }
        // Department user — return only available doctors in their department
        return doctorsRepository
                .findAllByAvailabilityStatusEqualsAndRole_Department_DepartmentNameIgnoreCase(
                        DoctorStatus.Available, departmentName)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // DELETED: ptDropdown()           — replaced by doctorDropdown() with departmentName param
    // DELETED: radiologistDropdown()  — replaced by doctorDropdown() with departmentName param

    //UPDATE
    public void updateDoctor(int doctorId, Doctors doctor) {
        Doctors doctorToUpdate = doctorsRepository.findById(doctorId)
                .orElseThrow(() -> new NotFound("Doctor not found"));

        if (doctor.getFirstName() != null && !doctor.getFirstName().isEmpty()) {
            doctorToUpdate.setFirstName(doctor.getFirstName());
        }

        if (doctor.getMiddleName() != null) {
            doctorToUpdate.setMiddleName(doctor.getMiddleName());
        }

        if (doctor.getLastName() != null && !doctor.getLastName().isEmpty()) {
            if (doctorsRepository.existsByFirstNameAndLastNameAndDoctorIdNot(
                    doctor.getFirstName() != null ? doctor.getFirstName() : doctorToUpdate.getFirstName(),
                    doctor.getLastName(),
                    doctorId)) {
                throw new AlreadyExists("Doctor already exists");
            }
            doctorToUpdate.setLastName(doctor.getLastName());
        }

        if (doctor.getRole() != null) {
            doctorToUpdate.setRole(doctor.getRole());
        }

        doctorToUpdate.setAvailabilityStatus(doctorToUpdate.getAvailabilityStatus());
        doctorsRepository.save(doctorToUpdate);
    }

    //MARK AS ON_LEAVE
    public void markLeave(int doctorId) {
        Doctors doctorToLeave = doctorsRepository.findById(doctorId)
                .orElseThrow(() -> new NotFound("Doctor not found"));

        if (doctorToLeave.getAvailabilityStatus().equals(DoctorStatus.On_Leave)) {
            throw new NoChangesDetected("Doctor is already on leave");
        }

        doctorToLeave.setAvailabilityStatus(DoctorStatus.On_Leave);
        doctorsRepository.save(doctorToLeave);
    }

    //MARK AS UNAVAILABLE
    public void markUnavailable(int doctorId) {
        Doctors doctorToUnavailable = doctorsRepository.findById(doctorId)
                .orElseThrow(() -> new NotFound("Doctor not found"));

        if (doctorToUnavailable.getAvailabilityStatus().equals(DoctorStatus.Unavailable)) {
            throw new NoChangesDetected("Doctor is already unavailable");
        }

        doctorToUnavailable.setAvailabilityStatus(DoctorStatus.Unavailable);
        doctorsRepository.save(doctorToUnavailable);
    }

    //MARK AS AVAILABLE
    public void markAvailable(int doctorId) {
        Doctors doctorToAvailable = doctorsRepository.findById(doctorId)
                .orElseThrow(() -> new NotFound("Doctor not found"));

        if (doctorToAvailable.getAvailabilityStatus().equals(DoctorStatus.Available)) {
            throw new NoChangesDetected("Doctor is already available");
        }

        doctorToAvailable.setAvailabilityStatus(DoctorStatus.Available);
        doctorsRepository.save(doctorToAvailable);
    }
}