package com.spring.Specifications;

import com.spring.Models.Logs;
import org.springframework.data.jpa.domain.Specification;

public class LogsSpecification {

    public static Specification<Logs> hasLogHeader(String logHeader){
        return (root, query, criteriaBuilder) -> {
            if (logHeader == null) return null;
            return criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("logHeader")),
                    "%" + logHeader + "%"
            );
        };
    }
}
