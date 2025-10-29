package com.zhangrichard.easy_kanban.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Data
@Entity
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

    private String clientId;

    private String leaderId;

    private String statusId;

    @OneToMany(mappedBy = "id.projectId", orphanRemoval = true)
    @JsonIgnore
    private Set<ProjectEmployee> projectEmployees = new HashSet<>();

    public Project() {
        super();
    }

    public Project(String name, String clientId, String leaderId, String statusId) {
        this.name = name;
        this.clientId = clientId;
        this.leaderId = leaderId;
        this.statusId = statusId;
    }
}
