package com.zhangrichard.easykanban.worker;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface WorkerMapper {

    @Select("<script> " +
            "SELECT w.id, w.name, w.remark, o.id AS orgId, o.name AS orgName " +
            "FROM worker w LEFT JOIN organization o ON w.orgId = o.id " +
            "WHERE w.deleted = 0 AND o.deleted = 0 " +
            "<if test='orgId != null'>" +
            "  AND o.id = #{orgId} " +
            "</if>" +
            "</script>")
    List<Worker> getWorkers(Long orgId);

    @Select("SELECT * FROM worker WHERE id = #{id} AND deleted = 0")
    Worker getOneWorker(Long id);

    @Select("SELECT COUNT(1) FROM worker WHERE " +
            "name = #{name} AND deleted = 0")
    Integer countWorkers(String name);

    @Insert("INSERT INTO worker (id, orgId, name, remark) " +
            "VALUES " +
            "(#{id}, #{orgId}, #{name}, #{remark}) ")
    void addWorker(Worker worker);

    @Update("UPDATE worker SET deleted = 1 WHERE id = #{id}")
    void deleteWorker(Long id);

    @Update("UPDATE worker SET name = #{name}, remark = #{remark} " +
            "WHERE id = #{id} AND deleted = 0")
    void updateWorker(Worker worker);
}
