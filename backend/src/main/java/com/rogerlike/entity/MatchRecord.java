package com.rogerlike.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("match_record")
public class MatchRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String difficulty;
    private Double survivedSec;
    private Integer kills;
    private Integer playerLevel;
    private Integer exp;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private LocalDateTime createdAt;
}
