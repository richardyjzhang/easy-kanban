package com.zhangrichard.easy_kanban.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Data
@Entity
public class ProjectStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

    @OneToMany(targetEntity = Project.class)
    @JoinColumn(name = "statusId", referencedColumnName = "id")
    private Set<Project> projects = new HashSet<>();

    public ProjectStatus() {
        super();
    }

    public ProjectStatus(String name) {
        this.name = name;
    }
}
