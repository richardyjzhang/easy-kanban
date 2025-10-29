package com.zhangrichard.easy_kanban.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Cascade;

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
    @JsonIgnore
    private Set<Project> managedProjects = new HashSet<>();

    @OneToMany(targetEntity = ProjectEmployee.class,
        cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<ProjectEmployee> projectEmployees = new HashSet<>();

    public Employee() {
        super();
    }

    public Employee(String name) {
        this.name = name;
    }
}
