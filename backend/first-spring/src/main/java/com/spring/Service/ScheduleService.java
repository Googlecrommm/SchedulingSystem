package com.spring.Service;

import com.spring.Enums.ScheduleStatus;
import com.spring.Exceptions.*;
import com.spring.Models.*;
import com.spring.Repositories.*;
import com.spring.Specifications.ScheduleSpecification;
import com.spring.dto.CreatePatientWithScheduleResponseDTO;
import com.spring.dto.SchedulePatchRequest;
import com.spring.dto.ScheduleResponseDTO;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class ScheduleService {
    private final ScheduleRepository scheduleRepository;
    private final PatientsRepository patientsRepository;
    private final DoctorsRepository doctorsRepository;
    private final MachinesRepository machinesRepository;
    private final ModelMapper modelMapper;
    private final RoomsRepository roomsRepository;
    private final LogsService logsService;

    public ScheduleService(
            ScheduleRepository scheduleRepository,
            PatientsRepository patientsRepository,
            DoctorsRepository doctorsRepository,
            MachinesRepository machinesRepository,
            ModelMapper modelMapper,
            RoomsRepository roomsRepository,
            LogsService logsService){
        this.scheduleRepository = scheduleRepository;
        this.patientsRepository = patientsRepository;
        this.doctorsRepository = doctorsRepository;
        this.machinesRepository = machinesRepository;
        this.modelMapper = modelMapper;
        this.roomsRepository = roomsRepository;
        this.logsService = logsService;
    }

    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM dd yyyy, hh:mma");

    public void validateNoConflict(Schedules newSchedule) {
        int excludeId = newSchedule.getScheduleId();
        LocalDateTime start = newSchedule.getStartDateTime();
        LocalDateTime end = newSchedule.getEndDateTime();

        if (scheduleRepository.isDoctorBooked(excludeId, newSchedule.getDoctor().getDoctorId(), start, end)) {
            throw new ConflictingSchedule("Doctor is already booked during this time slot.");
        }

        if (newSchedule.getMachine() != null) {
            if (scheduleRepository.isMachineBooked(excludeId, newSchedule.getMachine().getMachineId(), start, end)) {
                throw new ConflictingSchedule("Machine is already in use during this time slot.");
            }
        }

        if (newSchedule.getRoom() != null) {
            if (scheduleRepository.isRoomBooked(excludeId, newSchedule.getRoom().getRoomId(), start, end)) {
                throw new ConflictingSchedule("Room is already occupied during this time slot.");
            }
        }

        if (scheduleRepository.isPatientBooked(excludeId, newSchedule.getPatient().getPatientId(), start, end)) {
            throw new ConflictingSchedule("Patient already has a schedule during this time slot.");
        }
    }

    // Reusable DTO mapping helper
    private ScheduleResponseDTO mapToDTO(Schedules schedules) {
        ScheduleResponseDTO scheduleDTO = modelMapper.map(schedules, ScheduleResponseDTO.class);
        scheduleDTO.setDoctorFullName(schedules.getDoctor().getLastName() + ", "
                + schedules.getDoctor().getFirstName() + " "
                + (schedules.getDoctor().getMiddleName() == null ? "" : schedules.getDoctor().getMiddleName()));
        scheduleDTO.setPatientFullName(schedules.getPatient().getLastName() + ", "
                + schedules.getPatient().getFirstName() + " "
                + (schedules.getPatient().getMiddleName() == null ? "" : schedules.getPatient().getMiddleName()));
        scheduleDTO.setContactNumber(schedules.getPatient().getContactNumber());
        scheduleDTO.setBirthDate(schedules.getPatient().getBirthDate());
        scheduleDTO.setSex(schedules.getPatient().getSex());
        scheduleDTO.setAddress(schedules.getPatient().getAddress());
        scheduleDTO.setDepartmentName(schedules.getDoctor().getRole().getDepartment().getDepartmentName());
        scheduleDTO.setHospitalizationPlan(schedules.getHospitalizationPlan().getCompanyName());
        scheduleDTO.setHospitalizationType(schedules.getHospitalizationType().getTypeName());
        scheduleDTO.setMachineName(schedules.getMachine() == null ? "Non-Machine" : schedules.getMachine().getMachineName());
        scheduleDTO.setRoomName(schedules.getRoom() == null ? "Non-Room" : schedules.getRoom().getRoomName());
        return scheduleDTO;
    }

    //CREATE
    @Transactional
    public void createScheduleAndPatient(CreatePatientWithScheduleResponseDTO request) {

        // 1. Returning patient OR new patient
        Patients savedPatient;
        if (request.getExistingPatientId() != null) {
            savedPatient = patientsRepository.findById(request.getExistingPatientId())
                    .orElseThrow(() -> new RuntimeException("Patient not found with ID: "
                            + request.getExistingPatientId()));
        } else {
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

        // 5. Re-fetch full Room entity if present
        if (schedule.getRoom() != null) {
            Rooms fullRoom = roomsRepository.findById(schedule.getRoom().getRoomId())
                    .orElseThrow(() -> new RuntimeException("Room not found with ID: "
                            + schedule.getRoom().getRoomId()));

            int doctorDepartmentId = fullDoctor.getRole().getDepartment().getDepartmentId();
            int roomDepartmentId = fullRoom.getDepartment().getDepartmentId();

            if (doctorDepartmentId != roomDepartmentId) {
                throw new NotAllowed("Room does not belong to the doctor's department.");
            }

            schedule.setRoom(fullRoom);
        }

        // 6. Validate start is before end
        if (!schedule.getStartDateTime().isBefore(schedule.getEndDateTime())) {
            throw new NotAllowed("Start date/time must be before end date/time.");
        }

        // 7. Validate schedule is not in the past
        LocalDateTime now = LocalDateTime.now();
        if (schedule.getStartDateTime().isBefore(now)) {
            throw new NotAllowed("Cannot create a schedule in the past.");
        }

        // 8. Validate conflict
        validateNoConflict(schedule);

        // 9. Save
        //LOG CREATE
        logsService.log(
                "Schedule Added",
                "added new schedule for "
                        + schedule.getPatient().getFirstName() + " "
                        + (schedule.getPatient().getMiddleName() == null ? " " : schedule.getPatient().getMiddleName())
                        + schedule.getPatient().getLastName()
                        +"'s " + schedule.getProcedureName() +
                        " at " + schedule.getStartDateTime()
        );
        scheduleRepository.save(schedule);
    }

    //READ & FILTER (ADMIN)
    public Page<ScheduleResponseDTO> getSchedules(ScheduleStatus scheduleStatus, String name, String patientName, String departmentName, Pageable pageable){

        Specification<Schedules> filters = Specification
                .where(ScheduleSpecification.hasStatus(scheduleStatus))
                .and(ScheduleSpecification.toDoctor(name))
                .and(ScheduleSpecification.searchPatient(patientName))
                .and(ScheduleSpecification.hasDepartment(departmentName));

        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.ASC, "startDateTime")
        );

        return scheduleRepository.findAll(filters, sortedPageable).map(this::mapToDTO);
    }

    //READ & FILTER (RADIOLOGY)
    public Page<ScheduleResponseDTO> getRadiologySched(ScheduleStatus scheduleStatus, String name, String patientName, Pageable pageable){
        Specification<Schedules> filters = Specification
                .where(ScheduleSpecification.hasStatus(scheduleStatus))
                .and(ScheduleSpecification.toDoctor(name))
                .and(ScheduleSpecification.searchPatient(patientName))
                .and(ScheduleSpecification.hasDepartment("Radiology"));

        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.ASC, "startDateTime")
        );

        return scheduleRepository.findAll(filters, sortedPageable).map(this::mapToDTO);
    }

    //READ & FILTER (Rehabilitation)
    public Page<ScheduleResponseDTO> getRehabSched(ScheduleStatus scheduleStatus, String name, String patientName,  Pageable pageable){
        Specification<Schedules> filters = Specification
                .where(ScheduleSpecification.hasStatus(scheduleStatus))
                .and(ScheduleSpecification.toDoctor(name))
                .and(ScheduleSpecification.searchPatient(patientName))
                .and(ScheduleSpecification.hasDepartment("Rehabilitation"));
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.ASC, "startDateTime")
        );

        return scheduleRepository.findAll(filters, sortedPageable).map(this::mapToDTO);
    }

    //SEARCH
    public Page<ScheduleResponseDTO> searchSchedule(String patientName, Pageable pageable){
        return scheduleRepository.searchByPatientName(patientName, pageable)
                .map(this::mapToDTO);
    }

    //SEARCH
    public Page<ScheduleResponseDTO> searchRadioSched(String patientName, Pageable pageable){
        return scheduleRepository.searchByPatientName(patientName, pageable)
                .map(this::mapToDTO);
    }

    //COUNT ALL SCHEDULES
    public long countAllSchedules(ScheduleStatus scheduleStatus){
        Specification<Schedules> filters = Specification
                .where(ScheduleSpecification.hasDepartment("Radiology"));

        return scheduleRepository.allSchedulesCount(scheduleStatus);
    }

    // COUNT MONTHLY
    public Map<String, Long> getMonthlyBreakdown(String department) {
        Map<String, Long> counts = new LinkedHashMap<>();

        String[] months = {"January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"};

        for (int i = 1; i <= 12; i++) {
            LocalDateTime start = LocalDateTime.of(LocalDateTime.now().getYear(), i, 1, 0, 0);
            LocalDateTime end = start.with(TemporalAdjusters.lastDayOfMonth()).withHour(23).withMinute(59);

            final int month = i;
            Specification<Schedules> spec = Specification
                    .where(ScheduleSpecification.hasDepartment(department))
                    .and((root, query, cb) -> cb.between(root.get("startDateTime"), start, end));

            counts.put(months[i - 1], scheduleRepository.count(spec));
        }

        return counts;
    }

    //DASHBOARD COUNTS (ADMIN)
    public Map<String, Long> getDashboardCounts(String department, String filter) {
        Map<String, Long> counts = new HashMap<>();

        for (ScheduleStatus status : ScheduleStatus.values()) {
            Specification<Schedules> spec = Specification
                    .where(ScheduleSpecification.hasDepartment(department))
                    .and(ScheduleSpecification.hasStatus(status))
                    .and(ScheduleSpecification.byDateFilter(filter));

            counts.put(status.name(), scheduleRepository.count(spec));
        }

        return counts;
    }

    //DASHBOARD COUNTS (RADIOLOGY)
    public Map<String, Long> getDashboardCountsRadio(String filter) {
        Map<String, Long> counts = new HashMap<>();

        for (ScheduleStatus status : ScheduleStatus.values()) {
            Specification<Schedules> spec = Specification
                    .where(ScheduleSpecification.hasDepartment("Radiology"))
                    .and(ScheduleSpecification.hasStatus(status))
                    .and(ScheduleSpecification.byDateFilter(filter));

            counts.put(status.name(), scheduleRepository.count(spec));
        }

        return counts;
    }

    //DASHBOARD COUNTS (REHABILITATION)
    public Map<String, Long> getDashboardCountsRehab(String filter) {
        Map<String, Long> counts = new HashMap<>();

        for (ScheduleStatus status : ScheduleStatus.values()) {
            Specification<Schedules> spec = Specification
                    .where(ScheduleSpecification.hasDepartment("Rehabilitation"))
                    .and(ScheduleSpecification.hasStatus(status))
                    .and(ScheduleSpecification.byDateFilter(filter));

            counts.put(status.name(), scheduleRepository.count(spec));
        }

        return counts;
    }

    //UPDATE (full replace — requires complete data)
    @Transactional
    public void updateSchedule(int scheduleId, Schedules updatedSchedule) {

        // 1. Find existing schedule
        Schedules existing = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found with ID: " + scheduleId));

        // 2. Prevent restoring archived schedule if slot is already taken
        if (existing.getScheduleStatus() == ScheduleStatus.Archived) {
            int excludeId = existing.getScheduleId();
            LocalDateTime start = existing.getStartDateTime();
            LocalDateTime end = existing.getEndDateTime();

            boolean doctorTaken = scheduleRepository.isDoctorBooked(
                    excludeId, existing.getDoctor().getDoctorId(), start, end);

            boolean machineTaken = existing.getMachine() != null &&
                    scheduleRepository.isMachineBooked(
                            excludeId, existing.getMachine().getMachineId(), start, end);

            boolean roomTaken = existing.getRoom() != null &&
                    scheduleRepository.isRoomBooked(
                            excludeId, existing.getRoom().getRoomId(), start, end);

            boolean patientTaken = scheduleRepository.isPatientBooked(
                    excludeId, existing.getPatient().getPatientId(), start, end);

            if (doctorTaken || machineTaken || roomTaken || patientTaken) {
                throw new NotAllowed(
                        "Cannot restore this archived schedule — its time slot has already been taken."
                );
            }
        }

        // 3. Re-fetch full Doctor entity
        Doctors fullDoctor = doctorsRepository.findById(updatedSchedule.getDoctor().getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found with ID: "
                        + updatedSchedule.getDoctor().getDoctorId()));
        existing.setDoctor(fullDoctor);

        // 4. Re-fetch full Machine entity if present
        if (updatedSchedule.getMachine() != null) {
            Machines fullMachine = machinesRepository.findById(updatedSchedule.getMachine().getMachineId())
                    .orElseThrow(() -> new RuntimeException("Machine not found with ID: "
                            + updatedSchedule.getMachine().getMachineId()));
            existing.setMachine(fullMachine);
        } else {
            existing.setMachine(null);
        }

        // 5. Re-fetch full Room entity if present
        if (updatedSchedule.getRoom() != null) {
            Rooms fullRoom = roomsRepository.findById(updatedSchedule.getRoom().getRoomId())
                    .orElseThrow(() -> new RuntimeException("Room not found with ID: "
                            + updatedSchedule.getRoom().getRoomId()));

            int doctorDepartmentId = fullDoctor.getRole().getDepartment().getDepartmentId();
            int roomDepartmentId = fullRoom.getDepartment().getDepartmentId();

            if (doctorDepartmentId != roomDepartmentId) {
                throw new NotAllowed("Room does not belong to the doctor's department.");
            }

            existing.setRoom(fullRoom);
        } else {
            existing.setRoom(null);
        }

        // 6. Apply other fields
        existing.setScheduleStatus(updatedSchedule.getScheduleStatus());
        existing.setProcedureName(updatedSchedule.getProcedureName());
        existing.setRemarks(updatedSchedule.getRemarks());
        existing.setStartDateTime(updatedSchedule.getStartDateTime());
        existing.setEndDateTime(updatedSchedule.getEndDateTime());

        // 7. Validate start before end
        if (!existing.getStartDateTime().isBefore(existing.getEndDateTime())) {
            throw new NotAllowed("Start date/time must be before end date/time.");
        }

        // 8. Validate no conflict
        validateNoConflict(existing);

        // 9. Save
        //LOG CREATE
        logsService.log(
                "Schedule Updated",
                "updated the schedule information of "
                + existing.getPatient().getFirstName() + " "
                + (existing.getPatient().getMiddleName() == null ? " " : existing.getPatient().getMiddleName())
                + existing.getPatient().getLastName()
        );
        scheduleRepository.save(existing);
    }

    //PATCH (partial update — only updates fields that are provided)
    @Transactional
    public void patchSchedule(int scheduleId, SchedulePatchRequest patch) {

        // 1. Find existing schedule
        Schedules existing = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found with ID: " + scheduleId));

        // 2. Prevent restoring archived schedule if slot is already taken
        if (existing.getScheduleStatus() == ScheduleStatus.Archived) {
            int excludeId = existing.getScheduleId();
            LocalDateTime start = patch.getStartDateTime() != null ? patch.getStartDateTime() : existing.getStartDateTime();
            LocalDateTime end = patch.getEndDateTime() != null ? patch.getEndDateTime() : existing.getEndDateTime();

            boolean doctorTaken = scheduleRepository.isDoctorBooked(
                    excludeId, existing.getDoctor().getDoctorId(), start, end);

            boolean machineTaken = existing.getMachine() != null &&
                    scheduleRepository.isMachineBooked(
                            excludeId, existing.getMachine().getMachineId(), start, end);

            boolean roomTaken = existing.getRoom() != null &&
                    scheduleRepository.isRoomBooked(
                            excludeId, existing.getRoom().getRoomId(), start, end);

            boolean patientTaken = scheduleRepository.isPatientBooked(
                    excludeId, existing.getPatient().getPatientId(), start, end);

            if (doctorTaken || machineTaken || roomTaken || patientTaken) {
                throw new NotAllowed(
                        "Cannot restore this archived schedule — its time slot has already been taken."
                );
            }
        }

        // 3. Update Doctor only if provided
        Doctors doctorForValidation = existing.getDoctor();
        if (patch.getDoctorId() != null) {
            Doctors fullDoctor = doctorsRepository.findById(patch.getDoctorId())
                    .orElseThrow(() -> new RuntimeException("Doctor not found with ID: " + patch.getDoctorId()));
            existing.setDoctor(fullDoctor);
            doctorForValidation = fullDoctor;
        }

        // 4. Update Machine only if provided
        //    Send machineId = -1 to explicitly clear the machine
        if (patch.getMachineId() != null) {
            if (patch.getMachineId() == -1) {
                existing.setMachine(null);
            } else {
                Machines fullMachine = machinesRepository.findById(patch.getMachineId())
                        .orElseThrow(() -> new RuntimeException("Machine not found with ID: " + patch.getMachineId()));
                existing.setMachine(fullMachine);
            }
        }

        // 5. Update Room only if provided
        //    Send roomId = -1 to explicitly clear the room
        if (patch.getRoomId() != null) {
            if (patch.getRoomId() == -1) {
                existing.setRoom(null);
            } else {
                Rooms fullRoom = roomsRepository.findById(patch.getRoomId())
                        .orElseThrow(() -> new RuntimeException("Room not found with ID: " + patch.getRoomId()));

                int doctorDepartmentId = doctorForValidation.getRole().getDepartment().getDepartmentId();
                int roomDepartmentId = fullRoom.getDepartment().getDepartmentId();

                if (doctorDepartmentId != roomDepartmentId) {
                    throw new NotAllowed("Room does not belong to the doctor's department.");
                }

                existing.setRoom(fullRoom);
            }
        }

        // 6. Update simple fields only if provided
        if (patch.getScheduleStatus() != null) {
            existing.setScheduleStatus(patch.getScheduleStatus());
        }
        if (patch.getProcedureName() != null) {
            existing.setProcedureName(patch.getProcedureName());
        }
        if (patch.getRemarks() != null) {
            existing.setRemarks(patch.getRemarks());
        }
        if (patch.getStartDateTime() != null) {
            existing.setStartDateTime(patch.getStartDateTime());
        }
        if (patch.getEndDateTime() != null) {
            existing.setEndDateTime(patch.getEndDateTime());
        }

        // 7. Validate start before end
        if (!existing.getStartDateTime().isBefore(existing.getEndDateTime())) {
            throw new NotAllowed("Start date/time must be before end date/time.");
        }

        // 8. Validate no conflict
        validateNoConflict(existing);

        // 9. Save
        //LOG CREATE
        logsService.log(
                "Schedule Updated",
                "updated the schedule information of "
                        + existing.getPatient().getFirstName() + " "
                        + (existing.getPatient().getMiddleName() == null ? " " : existing.getPatient().getMiddleName())
                        + existing.getPatient().getLastName()
        );
        scheduleRepository.save(existing);
    }

    //ARCHIVE
    public void archiveSchedule(int scheduleId){
        Schedules scheduleToArchive = scheduleRepository.findById(scheduleId).orElseThrow(() -> new NotFound("Schedule not found"));

        if (scheduleToArchive.getScheduleStatus().equals(ScheduleStatus.Archived)){
            throw new NoChangesDetected("This schedule is already archived");
        }
        scheduleToArchive.setScheduleStatus(ScheduleStatus.Archived);

        //LOG CREATE
        logsService.log(
                "Schedule Archived",
                "archived the " + scheduleToArchive.getProcedureName() + " schedule of "
                        + scheduleToArchive.getPatient().getFirstName() + " "
                        + (scheduleToArchive.getPatient().getMiddleName() == null ? " " : scheduleToArchive.getPatient().getMiddleName())
                        + scheduleToArchive.getPatient().getLastName()
                        + " with the Schedule ID of " + scheduleId
        );
        scheduleRepository.save(scheduleToArchive);
    }

    //CANCELLED
    public void cancelSchedule(int scheduleId){
        Schedules scheduleToCancel = scheduleRepository.findById(scheduleId).orElseThrow(() -> new NotFound("Schedule not found"));

        if (scheduleToCancel.getScheduleStatus().equals(ScheduleStatus.Cancelled)){
            throw new NoChangesDetected("This schedule is already cancelled");
        }

        scheduleToCancel.setScheduleStatus(ScheduleStatus.Cancelled);
        //LOG CREATE
        logsService.log(
                "Schedule Cancelled",
                "cancelled the " + scheduleToCancel.getProcedureName() + " schedule of "
                        + scheduleToCancel.getPatient().getFirstName() + " "
                        + (scheduleToCancel.getPatient().getMiddleName() == null ? " " : scheduleToCancel.getPatient().getMiddleName())
                        + scheduleToCancel.getPatient().getLastName()
                        + " with the Schedule ID of " + scheduleId
        );
        scheduleRepository.save(scheduleToCancel);
    }

    //CONFIRMED
    public void confirmSchedule(int scheduleId){
        Schedules scheduleToConfirm = scheduleRepository.findById(scheduleId).orElseThrow(() -> new NotFound("Schedule not found"));

        if (scheduleToConfirm.getScheduleStatus().equals(ScheduleStatus.Confirmed)){
            throw new NoChangesDetected("This schedule is already confirmed");
        }

        scheduleToConfirm.setScheduleStatus(ScheduleStatus.Confirmed);
        //LOG CREATE
        logsService.log(
                "Schedule Confirmed",
                "confirmed the " + scheduleToConfirm.getProcedureName() + " schedule of "
                        + scheduleToConfirm.getPatient().getFirstName() + " "
                        + (scheduleToConfirm.getPatient().getMiddleName() == null ? " " : scheduleToConfirm.getPatient().getMiddleName())
                        + scheduleToConfirm.getPatient().getLastName()
                        + " with the Schedule ID of " + scheduleId
        );
        scheduleRepository.save(scheduleToConfirm);
    }

    //DONE
    public void doneSchedule(int scheduleId){
        Schedules scheduleToDone = scheduleRepository.findById(scheduleId).orElseThrow(() -> new NotFound("Schedule not found"));

        if (scheduleToDone.getScheduleStatus().equals(ScheduleStatus.Done)){
            throw new NoChangesDetected("This schedule is already marked as done");
        }

        scheduleToDone.setScheduleStatus(ScheduleStatus.Done);

        //LOG CREATE
        logsService.log(
                "Marked as Done",
                "marked the "+ scheduleToDone.getProcedureName() + " schedule of "
                        + scheduleToDone.getPatient().getFirstName() + " "
                        + (scheduleToDone.getPatient().getMiddleName() == null ? " " : scheduleToDone.getPatient().getMiddleName())
                        + scheduleToDone.getPatient().getLastName()
                        + " as done" + " with the Schedule ID of " + scheduleId
        );

        scheduleRepository.save(scheduleToDone);
    }

    //RESTORE
    public void restoreSchedule(int scheduleId){
        Schedules scheduleToRestore = scheduleRepository.findById(scheduleId).orElseThrow(() -> new NotFound("Schedule not found"));

        if (scheduleToRestore.getScheduleStatus().equals(ScheduleStatus.Scheduled)){
            throw new NoChangesDetected("This schedule is already marked as scheduled");
        }

        scheduleToRestore.setScheduleStatus(ScheduleStatus.Scheduled);
        //LOG CREATE
        logsService.log(
                "Marked as Scheduled",
                "marked the "+ scheduleToRestore.getProcedureName() + " schedule of "
                        + scheduleToRestore.getPatient().getFirstName() + " "
                        + (scheduleToRestore.getPatient().getMiddleName() == null ? " " : scheduleToRestore.getPatient().getMiddleName())
                        + scheduleToRestore.getPatient().getLastName()
                        + " as scheduled" + " with the Schedule ID of " + scheduleId
        );
        scheduleRepository.save(scheduleToRestore);
    }

    //PRINT
    public byte[] exportSchedulesToPdf(String department, String filter) {
        Specification<Schedules> spec = Specification
                .where(ScheduleSpecification.hasDepartment(department))
                .and(ScheduleSpecification.byDateFilter(filter));

        List<Schedules> schedules = scheduleRepository.findAll(spec);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            // Title
            Font titleFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD);
            Paragraph title = new Paragraph((department == null ? "All Departments" : department) + " Schedules - " + filter.toUpperCase(), titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            // Table with columns
            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 2f, 2f, 2f, 2f, 2f, 1.5f});

            // Headers
            for (String header : new String[]{"Schedule ID", "Patient", "Doctor", "Procedure", "Start", "End", "Status"}) {
                PdfPCell cell = new PdfPCell(new Phrase(header, new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.WHITE)));
                cell.setBackgroundColor(BaseColor.BLUE);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(5);
                table.addCell(cell);
            }

            // Rows
            for (Schedules s : schedules) {
                table.addCell(String.valueOf(s.getScheduleId()));
                table.addCell(s.getPatient().getLastName() + ", "
                        + s.getPatient().getFirstName() + " "
                        + (s.getPatient().getMiddleName() == null ? "" : s.getPatient().getMiddleName()));
                table.addCell(s.getDoctor().getLastName() + ", "
                        + s.getDoctor().getFirstName() + " "
                        + (s.getDoctor().getMiddleName() == null ? "" : s.getDoctor().getMiddleName()));
                table.addCell(s.getProcedureName());
                table.addCell(s.getStartDateTime().format(formatter));
                table.addCell(s.getEndDateTime().format(formatter));
                table.addCell(s.getScheduleStatus().name());
            }

            document.add(table);
            document.close();

            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }
}