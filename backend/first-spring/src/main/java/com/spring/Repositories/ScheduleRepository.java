package com.spring.Repositories;

import com.spring.Models.Schedules;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleRepository extends JpaRepository<Schedules, Integer> {

}
