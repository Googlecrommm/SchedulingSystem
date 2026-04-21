package com.spring.Service;

import com.spring.Enums.ScheduleStatus;
import com.spring.Models.Patients;
import com.spring.Models.Schedules;
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

@Service
public class ScheduleService {
    private final ScheduleRepository scheduleRepository;
    private final PatientsRepository patientsRepository;
    private final ModelMapper modelMapper;

    public ScheduleService(ScheduleRepository scheduleRepository, PatientsRepository patientsRepository, ModelMapper modelMapper){
        this.scheduleRepository = scheduleRepository;
        this.patientsRepository = patientsRepository;
        this.modelMapper = modelMapper;
    }

    //CREATE
    @Transactional
    public void createScheduleAndPatient(CreatePatientWithScheduleResponseDTO request){
        Patients patient = request.getPatient();
        Patients savedPatient = patientsRepository.save(patient);

        Schedules schedule = request.getSchedules();
        schedule.setPatient(savedPatient);

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
