package com.zhangrichard.easy_kanban.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Data
@Entity
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

    @OneToMany(targetEntity = Project.class)
    @JoinColumn(name = "leaderId", referencedColumnName = "id")
    private Set<Project> projects = new HashSet<>();

    public Employee() {
        super();
    }

    public Employee(String name) {
        this.name = name;
    }
}
