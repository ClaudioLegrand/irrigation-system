package com.legrandc.irrigation_system.models;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

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
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime startTime;

    @Column(nullable = false)
    private Integer durationMinutes;

    @Column
    private UUID startJobId;

    @Column
    private UUID stopJobId;

    @Column(nullable = false)
    private Boolean enabled;
}
