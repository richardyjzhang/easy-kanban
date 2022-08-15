package com.zhangrichard.easykanban.worker;

import com.zhangrichard.easykanban.organization.Organization;
import com.zhangrichard.easykanban.organization.OrganizationMapper;
import com.zhangrichard.easykanban.security.AuthUtils;
import com.zhangrichard.easykanban.security.entity.LoginUser;
import com.zhangrichard.easykanban.utils.IdWorker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.util.List;

@RestController
public class WorkerController {

    @Autowired
    AuthUtils authUtils;

    @Autowired
    WorkerMapper workerMapper;

    @Autowired
    OrganizationMapper organizationMapper;

    @Autowired
    IdWorker idWorker;

    @GetMapping("/workers")
    public List<Worker> getWorkers() {

        LoginUser user = authUtils.currentUser();
        Long orgId = null;
        if (!user.getSysAdmin()) {
            orgId = user.getOrgId();
        }

        List<Worker> workers = workerMapper.getWorkers(orgId);
        return workers;
    }

    @PostMapping("/workers")
    public Worker addWorker(
            @RequestBody Worker worker, HttpServletResponse response) {

        // 名字必填
        String name = worker.getName();
        if (name == null || name.isBlank()) {
            response.setStatus(400);
            return null;
        }

        // 名字不允许重复
        Integer cnt = workerMapper.countWorkers(name);
        if (cnt > 0) {
            response.setStatus(400);
            return null;
        }

        // 非管理员仅能新增自己组织人力
        LoginUser user = authUtils.currentUser();
        if (!user.getSysAdmin()) {
            Long userOrgId = user.getOrgId();
            if (!userOrgId.equals(worker.getOrgId())) {
                response.setStatus(403);
                return null;
            }

            // 补充人力名称
            worker.setOrgName(user.getOrgName());
        } else {
            if (worker.getOrgId().equals(user.getOrgId())) {
                worker.setOrgName(user.getOrgName());
            } else {
                List<Organization> organizations =
                        organizationMapper.getOrganizations(worker.getOrgId());
                if (organizations.size() == 1) {
                    worker.setOrgName(organizations.get(0).getName());
                } else {
                    response.setStatus(400);
                    return null;
                }
            }
        }

        // 生成ID
        Long id = idWorker.nextId();
        worker.setId(id);

        // 插入数据库
        workerMapper.addWorker(worker);

        return worker;
    }

    @DeleteMapping("/workers/{id}")
    public void deleteWorker(
            @PathVariable(name="id") Long id, HttpServletResponse response) {

        if (!authUtils.hasAuthWorker(id)) {
            response.setStatus(403);
            return;
        }

        workerMapper.deleteWorker(id);
    }

    @PutMapping("/workers/{id}")
    public Worker updateWorker(
            @PathVariable(name="id") Long id,
            @RequestBody Worker worker,
            HttpServletResponse response) {

        if (!authUtils.hasAuthWorker(id)) {
            response.setStatus(403);
            return null;
        }

        // 查找修改前的数据
        Worker original = workerMapper.getOneWorker(id);
        if (original == null) {
            response.setStatus(400);
            return null;
        }

        // 名字不允许重复
        Integer cnt = workerMapper.countWorkers(worker.getName());
        if (!worker.getName().equals(original.getName()) && cnt > 0) {
            response.setStatus(400);
            return null;
        }

        worker.setId(id);
        workerMapper.updateWorker(worker);

        return worker;
    }

}
