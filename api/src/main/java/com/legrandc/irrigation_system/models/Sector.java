package com.legrandc.irrigation_system.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

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
    private SectorState currentState = SectorState.INACTIVE;

    @OneToMany(mappedBy = "sector", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<IrrigationConfiguration> configurations = new ArrayList<>();

    @OneToMany(mappedBy = "sector", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<IrrigationHistory> history = new ArrayList<>();

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
