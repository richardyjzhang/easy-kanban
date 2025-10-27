package com.zhangrichard.easy_kanban.controller;

import com.zhangrichard.easy_kanban.model.Employee;
import com.zhangrichard.easy_kanban.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;

@RestController
public class EmployeeController {

    @Autowired
    EmployeeService employeeService;

    @GetMapping("/employees")
    public ArrayList<Employee> getAllEmployee() {
        return employeeService.findAllEmployee();
    }

    @GetMapping("/employees/{id}")
    public Employee getEmployeeById(@PathVariable String id) {
        return employeeService.findAllEmployeeById(id);
    }

    @GetMapping("/employees/add")
    public void addEmployees() {
        employeeService.addEmployee();
    }

    @GetMapping("/employees/delete")
    public void deleteEmployees() {
        employeeService.deleteAllData();
    }
}
