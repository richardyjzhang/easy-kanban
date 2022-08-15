package com.zhangrichard.easykanban.project;

import com.zhangrichard.easykanban.security.AuthUtils;
import com.zhangrichard.easykanban.security.entity.LoginUser;
import com.zhangrichard.easykanban.utils.IdWorker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ProjectController {

    @Autowired
    AuthUtils authUtils;

    @Autowired
    ProjectMapper projectMapper;

    @Autowired
    IdWorker idWorker;

    @GetMapping("/projects")
    public List<Project> getProjects() {

        LoginUser user = authUtils.currentUser();
        Long orgId = null;
        if (!user.getSysAdmin()) {
            orgId = user.getOrgId();
        }

        List<Project> projects = projectMapper.getProjects(orgId);
        return projects;
    }
}
