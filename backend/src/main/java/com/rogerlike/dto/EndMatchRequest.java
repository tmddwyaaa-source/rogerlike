package com.rogerlike.dto;

import lombok.Data;

@Data
public class EndMatchRequest {
    private String difficulty;
    private Double survivedSec;
    private Integer kills;
    private Integer level;
    private Integer exp;
}
