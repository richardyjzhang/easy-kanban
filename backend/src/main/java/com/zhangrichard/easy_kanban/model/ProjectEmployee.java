package com.zhangrichard.easy_kanban.model;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class ProjectEmployee {

    @EmbeddedId
    @JsonUnwrapped
    private ProjectEmployeeId id;

    public ProjectEmployee(String projectId, String employeeId) {
        this.id = new ProjectEmployeeId(projectId, employeeId);
    }
}
