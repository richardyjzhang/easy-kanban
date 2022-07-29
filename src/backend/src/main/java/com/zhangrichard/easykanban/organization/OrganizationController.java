package com.zhangrichard.easykanban.organization;

import com.zhangrichard.easykanban.security.entity.LoginUser;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;
import java.util.List;

@RestController
public class OrganizationController {

    @Autowired
    OrganizationMapper  organizationMapper;

    @GetMapping("/organizations")
    public List<Organization> getOrganizations(HttpServletResponse response) {
        // 该接口仅允许系统管理员访问
        Subject subject = SecurityUtils.getSubject();
        LoginUser user = (LoginUser) subject.getPrincipal();
        if (!user.getSysAdmin()) {
            response.setStatus(403);
        }

        List<Organization> organizations = organizationMapper.getOrganizations();
        return organizations;
    }
}
