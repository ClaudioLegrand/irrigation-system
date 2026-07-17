package com.legrandc.irrigation_system.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "irrigation_history")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class IrrigationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_id", nullable = false)
    private Sector sector;

    private LocalDateTime startDateTime;

    private LocalDateTime endDateTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OriginOrder originOrder;
    
}
