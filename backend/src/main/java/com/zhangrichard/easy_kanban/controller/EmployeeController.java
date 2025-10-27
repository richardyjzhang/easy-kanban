package com.zhangrichard.easy_kanban.controller;

import com.zhangrichard.easy_kanban.model.Employee;
import com.zhangrichard.easy_kanban.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;

@RestController
public class EmployeeController {

    @Autowired
    EmployeeService employeeService;

    @GetMapping("/employees")
    public ArrayList<Employee> getAllEmployee() {
        return employeeService.findAllEmployee();
    }

    @PostMapping("/employees")
    public Employee addOneEmployee(@RequestBody Employee employee) {
        Employee newEmployee = employeeService.addOneEmployee(employee);
        return newEmployee;
    }

    @PutMapping("/employees/{id}")
    public Employee updateOneEmployee(@RequestBody Employee employee, @PathVariable String id) {
        Employee newEmployee = employeeService.updateOneEmployee(employee, id);
        return newEmployee;
    }

    @DeleteMapping("/employees/{id}")
    public void deleteOneEmployee(@PathVariable String id) {
        employeeService.deleteOneEmployee(id);
    }
}
