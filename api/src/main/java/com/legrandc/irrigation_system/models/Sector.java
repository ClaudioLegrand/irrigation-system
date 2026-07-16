package com.legrandc.irrigation_system.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "sectors")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Sector {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1024)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SectorState currentState;

    @OneToMany(mappedBy = "sector", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<IrrigationConfiguration> configurations = new ArrayList<>();

    @OneToMany(mappedBy = "sector", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<IrrigationHistory> history = new ArrayList<>();

    @Column(updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    public void addConfiguration(IrrigationConfiguration configuration) {
        configurations.add(configuration);
        configuration.setSector(this);
    }

    public void removeConfiguration(IrrigationConfiguration configuration) {
        configurations.remove(configuration);
        configuration.setSector(null);
    }

    public void addHistory(IrrigationHistory historyEntry) {
        history.add(historyEntry);
        historyEntry.setSector(this);
    }

    public void removeHistory(IrrigationHistory historyEntry) {
        history.remove(historyEntry);
        historyEntry.setSector(null);
    }
}
