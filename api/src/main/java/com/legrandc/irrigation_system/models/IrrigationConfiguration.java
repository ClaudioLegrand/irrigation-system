package com.legrandc.irrigation_system.models;

import jakarta.persistence.*;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "irrigation_configurations")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class IrrigationConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_id", nullable = false)
    private Sector sector;

    @Column(nullable = false)
    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @Column(nullable = false)
    private Integer durationMinutes;

    @Column(nullable = false)
    private Boolean enabled;
}
