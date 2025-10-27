package com.zhangrichard.easy_kanban.service;

import com.zhangrichard.easy_kanban.model.Employee;
import com.zhangrichard.easy_kanban.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Optional;

@Service
public class EmployeeServiceImpl implements EmployeeService {

    @Autowired
    EmployeeRepository employeeRepository;

    @Override
    public ArrayList<Employee> findAllEmployee() {
        return (ArrayList<Employee>) employeeRepository.findAll();
    }

    @Override
    public Employee addOneEmployee(Employee employee) {
        Employee newEmployee = employeeRepository.save(employee);
        return newEmployee;
    }

    @Override
    public Employee updateOneEmployee(Employee employee, String id) {
        employee.setId(id);
        employeeRepository.save(employee);
        return employee;
    }

    @Override
    public void deleteOneEmployee(String id) {
        employeeRepository.deleteById(id);
    }
}
