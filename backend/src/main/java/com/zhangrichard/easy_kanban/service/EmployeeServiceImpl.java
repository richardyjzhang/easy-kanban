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
    public Employee findAllEmployeeById(String Id) {
        Optional<Employee> opt = employeeRepository.findById(Id);
        if (opt.isPresent())
            return opt.get();
        else
            return null;
    }

    @Override
    public void addEmployee() {
        ArrayList<Employee> employees = new ArrayList<>();
        employees.add(new Employee("Zhang San"));
        employees.add(new Employee("Li Si"));
        employees.add(new Employee("Wang Wu"));

        for (Employee employee : employees) {
            employeeRepository.save(employee);
        }
    }

    @Override
    public void deleteAllData() {
        employeeRepository.deleteAll();
    }
}
