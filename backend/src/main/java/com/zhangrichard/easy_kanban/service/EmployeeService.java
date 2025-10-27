package com.zhangrichard.easy_kanban.service;

import com.zhangrichard.easy_kanban.model.Employee;

import java.util.ArrayList;

public interface EmployeeService {
    ArrayList<Employee> findAllEmployee();
    Employee addOneEmployee(Employee employee);
    Employee updateOneEmployee(Employee employee, String id);
    void deleteOneEmployee(String id);
}
