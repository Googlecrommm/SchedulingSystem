package com.spring.Service;

import com.spring.Enums.DoctorStatus;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NoChangesDetected;
import com.spring.Exceptions.NotAllowed;
import com.spring.Exceptions.NotFound;
import com.spring.Models.Doctors;
import com.spring.Models.Roles;
import com.spring.Models.Users;
import com.spring.Repositories.DoctorsRepository;
import com.spring.Repositories.RolesRepository;
import com.spring.Specifications.DoctorSpecification;
import com.spring.dto.DoctorsResponseDTO;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DoctorService {
    private final DoctorsRepository doctorsRepository;
    private final ModelMapper modelMapper;
    private final RolesRepository rolesRepository;

    public DoctorService(DoctorsRepository doctorsRepository, ModelMapper modelMapper, RolesRepository rolesRepository) {
        this.doctorsRepository = doctorsRepository;
        this.modelMapper = modelMapper;
        this.rolesRepository = rolesRepository;
    }

    // ─── Admin bypasses department check; frontdesk is scoped to their department ─
    private void validateDoctorBelongsToDepartment(Doctors doctor, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return;

        Users user = (Users) authentication.getPrincipal();

        if (user.getRole() == null || user.getRole().getDepartment() == null) {
            throw new NotAllowed("You are not assigned to any department.");
        }

        String userDept = user.getRole().getDepartment().getDepartmentName();
        String doctorDept = doctor.getRole().getDepartment().getDepartmentName();

        if (!userDept.equalsIgnoreCase(doctorDept)) {
            throw new NotAllowed(
                    "You can only manage doctors within your department (" + userDept + ")."
            );
        }
    }

    // ─── Reusable DTO mapping helper ─────────────────────────────────────────────
    private DoctorsResponseDTO mapToDTO(Doctors doctors) {
        DoctorsResponseDTO doctorDTO = modelMapper.map(doctors, DoctorsResponseDTO.class);
        doctorDTO.setFullName(doctors.getLastName() + ", "
                        + doctors.getFirstName() + " "
                        + (doctors.getMiddleName() == null ? "" : doctors.getMiddleName()));
        doctorDTO.setRoleName(doctors.getRole().getRoleName());
        doctorDTO.setDepartmentName(doctors.getRole().getDepartment().getDepartmentName());
        return doctorDTO;
    }

    //CREATE
    public void addDoctor(Doctors doctors, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            Users user = (Users) authentication.getPrincipal();

            if (user.getRole() == null || user.getRole().getDepartment() == null) {
                throw new NotAllowed("You are not assigned to any department.");
            }

            if (doctors.getRole() == null || doctors.getRole().getRoleId() == 0) {
                throw new NotAllowed("A role is required.");
            }

            Roles assignedRole = rolesRepository.findById(doctors.getRole().getRoleId())
                    .orElseThrow(() -> new NotFound("Role not found"));

            String userDept = user.getRole().getDepartment().getDepartmentName();
            String assignedRoleDept = assignedRole.getDepartment().getDepartmentName();

            if (!userDept.equalsIgnoreCase(assignedRoleDept)) {
                throw new NotAllowed(
                        "You can only add doctors under your department (" + userDept + ")."
                );
            }
        }

        if (doctorsRepository.existsByFirstNameAndLastName(doctors.getFirstName(), doctors.getLastName())) {
            throw new AlreadyExists("This doctor already exists");
        }

        doctorsRepository.save(doctors);
    }

    //READ & FILTER
    public Page<DoctorsResponseDTO> getDoctors(DoctorStatus availabilityStatus, String roleName, String departmentName, Pageable pageable) {
        Specification<Doctors> filters = Specification
                .where(DoctorSpecification.hasStatus(availabilityStatus))
                .and(DoctorSpecification.hasRole(roleName))
                .and(DoctorSpecification.hasDepartment(departmentName));

        return doctorsRepository.findAll(filters, pageable).map(this::mapToDTO);
    }

    //SEARCH
    public Page<DoctorsResponseDTO> searchDoctor(String searchName, String departmentName, Pageable pageable) {
        Specification<Doctors> filters = Specification
                .where(DoctorSpecification.hasDepartment(departmentName))
                .and((root, query, cb) -> cb.or(
                        cb.like(cb.lower(root.get("firstName")), "%" + searchName.toLowerCase() + "%"),
                        cb.like(cb.lower(root.get("lastName")), "%" + searchName.toLowerCase() + "%")
                ));

        return doctorsRepository.findAll(filters, pageable).map(this::mapToDTO);
    }

    //DROPDOWN
    public List<DoctorsResponseDTO> doctorDropdown(String departmentName) {
        if (departmentName == null) {
            return doctorsRepository.findAllByAvailabilityStatusEquals(DoctorStatus.Available)
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }
        return doctorsRepository
                .findAllByAvailabilityStatusEqualsAndRole_Department_DepartmentNameIgnoreCase(
                        DoctorStatus.Available, departmentName)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    //UPDATE
    public void updateDoctor(int doctorId, Doctors doctor, Authentication authentication) {
        Doctors doctorToUpdate = doctorsRepository.findById(doctorId)
                .orElseThrow(() -> new NotFound("Doctor not found"));

        validateDoctorBelongsToDepartment(doctorToUpdate, authentication);

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

        if (doctor.getRole() != null && doctor.getRole().getRoleId() != 0) {
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            if (!isAdmin) {
                // Frontdesk can only reassign to a role within their own department
                Users user = (Users) authentication.getPrincipal();
                Roles newRole = rolesRepository.findById(doctor.getRole().getRoleId())
                        .orElseThrow(() -> new NotFound("Role not found"));

                String userDept = user.getRole().getDepartment().getDepartmentName();
                String newRoleDept = newRole.getDepartment().getDepartmentName();

                if (!userDept.equalsIgnoreCase(newRoleDept)) {
                    throw new NotAllowed(
                            "You can only assign roles within your department (" + userDept + ")."
                    );
                }
            }
            doctorToUpdate.setRole(doctor.getRole());
        }

        doctorsRepository.save(doctorToUpdate);
    }

    //MARK AS ON_LEAVE — admin and frontdesk, department scoped for frontdesk
    public void markLeave(int doctorId, Authentication authentication) {
        Doctors doctorToLeave = doctorsRepository.findById(doctorId)
                .orElseThrow(() -> new NotFound("Doctor not found"));

        validateDoctorBelongsToDepartment(doctorToLeave, authentication);

        if (doctorToLeave.getAvailabilityStatus().equals(DoctorStatus.On_Leave)) {
            throw new NoChangesDetected("Doctor is already on leave");
        }

        doctorToLeave.setAvailabilityStatus(DoctorStatus.On_Leave);
        doctorsRepository.save(doctorToLeave);
    }

    //MARK AS UNAVAILABLE — admin and frontdesk, department scoped for frontdesk
    public void markUnavailable(int doctorId, Authentication authentication) {
        Doctors doctorToUnavailable = doctorsRepository.findById(doctorId)
                .orElseThrow(() -> new NotFound("Doctor not found"));

        validateDoctorBelongsToDepartment(doctorToUnavailable, authentication);

        if (doctorToUnavailable.getAvailabilityStatus().equals(DoctorStatus.Unavailable)) {
            throw new NoChangesDetected("Doctor is already unavailable");
        }

        doctorToUnavailable.setAvailabilityStatus(DoctorStatus.Unavailable);
        doctorsRepository.save(doctorToUnavailable);
    }

    //MARK AS AVAILABLE — admin and frontdesk, department scoped for frontdesk
    public void markAvailable(int doctorId, Authentication authentication) {
        Doctors doctorToAvailable = doctorsRepository.findById(doctorId)
                .orElseThrow(() -> new NotFound("Doctor not found"));

        validateDoctorBelongsToDepartment(doctorToAvailable, authentication);

        if (doctorToAvailable.getAvailabilityStatus().equals(DoctorStatus.Available)) {
            throw new NoChangesDetected("Doctor is already available");
        }

        doctorToAvailable.setAvailabilityStatus(DoctorStatus.Available);
        doctorsRepository.save(doctorToAvailable);
    }
}