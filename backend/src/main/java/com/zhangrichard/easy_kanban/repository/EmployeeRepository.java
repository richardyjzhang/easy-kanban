package com.zhangrichard.easy_kanban.repository;

import com.zhangrichard.easy_kanban.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {

}
