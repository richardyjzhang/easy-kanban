package com.zhangrichard.easy_kanban.controller;

import com.zhangrichard.easy_kanban.model.Client;
import com.zhangrichard.easy_kanban.service.ClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;

@RestController
public class ClientController {

    @Autowired
    ClientService ClientService;

    @GetMapping("/clients")
    public ArrayList<Client> getAllClient() {
        return ClientService.findAllClient();
    }

    @PostMapping("/clients")
    public Client addOneClient(@RequestBody Client client) {
        Client newClient = ClientService.addOneClient(client);
        return newClient;
    }

    @PutMapping("/clients/{id}")
    public ResponseEntity<Client> updateOneClient(@RequestBody Client client, @PathVariable String id) {
        Client newClient = ClientService.updateOneClient(client, id);
        if (newClient.getId() == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(newClient);
    }

    @DeleteMapping("/clients/{id}")
    public void deleteOneClient(@PathVariable String id) {
        ClientService.deleteOneClient(id);
    }
}
