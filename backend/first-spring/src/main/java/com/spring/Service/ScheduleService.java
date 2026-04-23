package com.spring.Service;

import com.spring.Enums.ScheduleStatus;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.ConflictingSchedule;
import com.spring.Exceptions.NotAllowed;
import com.spring.Models.Doctors;
import com.spring.Models.Machines;
import com.spring.Models.Patients;
import com.spring.Models.Schedules;
import com.spring.Repositories.DoctorsRepository;
import com.spring.Repositories.MachinesRepository;
import com.spring.Repositories.PatientsRepository;
import com.spring.Repositories.ScheduleRepository;
import com.spring.Specifications.ScheduleSpecification;
import com.spring.dto.CreatePatientWithScheduleResponseDTO;
import com.spring.dto.ScheduleResponseDTO;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScheduleService {
    private final ScheduleRepository scheduleRepository;
    private final PatientsRepository patientsRepository;
    private final DoctorsRepository doctorsRepository;
    private final MachinesRepository machinesRepository;
    private final ModelMapper modelMapper;

    public ScheduleService(
            ScheduleRepository scheduleRepository,
            PatientsRepository patientsRepository,
            DoctorsRepository doctorsRepository,
            MachinesRepository machinesRepository,
            ModelMapper modelMapper){
        this.scheduleRepository = scheduleRepository;
        this.patientsRepository = patientsRepository;
        this.doctorsRepository = doctorsRepository;
        this.machinesRepository = machinesRepository;
        this.modelMapper = modelMapper;

    }

    public void validateNoConflict(Schedules newSchedule) {
        int departmentId = newSchedule.getDoctor()
                .getRole()
                .getDepartment()
                .getDepartmentId();

        Integer machineId = newSchedule.getMachine() != null
                ? newSchedule.getMachine().getMachineId()
                : null;

        List<Schedules> conflicts = scheduleRepository.findConflictingSchedules(
                newSchedule.getScheduleId(),
                departmentId,
                newSchedule.getDoctor().getDoctorId(),
                machineId,
                newSchedule.getPatient().getPatientId(),
                newSchedule.getStartDateTime(),
                newSchedule.getEndDateTime()
        );

        if (!conflicts.isEmpty()) {
            Schedules conflict = conflicts.get(0);
            throw new ConflictingSchedule("Conflict schedule");
        }
    }

    //CREATE
    @Transactional
    public void createScheduleAndPatient(CreatePatientWithScheduleResponseDTO request) {

        // 1. Returning patient OR new patient
        Patients savedPatient;
        if (request.getExistingPatientId() != null) {
            // Just look up the existing patient, no save/update
            savedPatient = patientsRepository.findById(request.getExistingPatientId())
                    .orElseThrow(() -> new RuntimeException("Patient not found with ID: "
                            + request.getExistingPatientId()));
        } else {
            // New patient — check for duplicate first
            String contactNumber = request.getPatient().getContactNumber();

            if (patientsRepository.existsByContactNumber(contactNumber)) {
                throw new AlreadyExists(
                        "Patient with contact number " + contactNumber + " already exists. " +
                                "Please use existingPatientId instead."
                );
            }

            savedPatient = patientsRepository.save(request.getPatient());
        }

        // 2. Attach patient to schedule
        Schedules schedule = request.getSchedules();
        schedule.setPatient(savedPatient);

        // 3. Re-fetch full Doctor entity
        Doctors fullDoctor = doctorsRepository.findById(schedule.getDoctor().getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found with ID: "
                        + schedule.getDoctor().getDoctorId()));
        schedule.setDoctor(fullDoctor);

        // 4. Re-fetch full Machine entity if present
        if (schedule.getMachine() != null) {
            Machines fullMachine = machinesRepository.findById(schedule.getMachine().getMachineId())
                    .orElseThrow(() -> new RuntimeException("Machine not found with ID: "
                            + schedule.getMachine().getMachineId()));
            schedule.setMachine(fullMachine);
        }

        // 5. Validate start is before end
        if (!schedule.getStartDateTime().isBefore(schedule.getEndDateTime())) {
            throw new NotAllowed("Start date/time must be before end date/time.");
        }

        // 6. Validate conflict
        validateNoConflict(schedule);

        // 7. Save
        scheduleRepository.save(schedule);
    }

    //READ & FILTER
    public Page<ScheduleResponseDTO> getSchedules(ScheduleStatus scheduleStatus, String name, Pageable pageable){

        Specification<Schedules> filters = Specification
                .where(ScheduleSpecification.hasStatus(scheduleStatus))
                .and(ScheduleSpecification.toDoctor(name));

        return scheduleRepository.findAll(filters, pageable)
                .map(schedules -> {
                    ScheduleResponseDTO scheduleDTO =  modelMapper.map(schedules, ScheduleResponseDTO.class);
                    scheduleDTO.setName(schedules.getDoctor().getName());
                    if (schedules.getMachine() == null){
                        scheduleDTO.setMachineName("Non-Machine");
                    }
                    else {
                        scheduleDTO.setMachineName(schedules.getMachine().getMachineName());
                    }
                    return scheduleDTO;
                });
    }
}
