package com.rogerlike.web;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.rogerlike.dto.EndMatchRequest;
import com.rogerlike.dto.StartMatchRequest;
import com.rogerlike.entity.MatchRecord;
import com.rogerlike.mapper.MatchRecordMapper;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api")
public class MatchController {
    private final MatchRecordMapper mapper;

    public MatchController(MatchRecordMapper mapper) {
        this.mapper = mapper;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("ok", true);
    }

    @PostMapping("/matches/start")
    public MatchRecord start(@RequestBody(required = false) StartMatchRequest req) {
        MatchRecord row = new MatchRecord();
        row.setDifficulty(difficultyOf(req == null ? null : req.getDifficulty()));
        row.setSurvivedSec(0d);
        row.setKills(0);
        row.setPlayerLevel(1);
        row.setExp(0);
        row.setStartedAt(LocalDateTime.now());
        row.setCreatedAt(LocalDateTime.now());
        mapper.insert(row);
        return row;
    }

    @PostMapping("/matches/{id}/end")
    public MatchRecord end(@PathVariable Long id, @RequestBody EndMatchRequest req) {
        MatchRecord row = mapper.selectById(id);
        if (row == null) {
            throw new ResponseStatusException(NOT_FOUND, "match not found");
        }
        applyEnd(row, req);
        mapper.updateById(row);
        return row;
    }

    @PostMapping("/matches")
    public MatchRecord report(@RequestBody EndMatchRequest req) {
        MatchRecord row = new MatchRecord();
        row.setDifficulty(difficultyOf(req.getDifficulty()));
        row.setStartedAt(LocalDateTime.now());
        row.setCreatedAt(LocalDateTime.now());
        applyEnd(row, req);
        mapper.insert(row);
        return row;
    }

    @GetMapping("/matches/top")
    public List<MatchRecord> top(@RequestParam(defaultValue = "10") int limit) {
        int n = Math.min(50, Math.max(1, limit));
        return mapper.selectList(new LambdaQueryWrapper<MatchRecord>()
                .isNotNull(MatchRecord::getEndedAt)
                .orderByDesc(MatchRecord::getSurvivedSec)
                .last("LIMIT " + n));
    }

    private static void applyEnd(MatchRecord row, EndMatchRequest req) {
        if (req.getDifficulty() != null) {
            row.setDifficulty(difficultyOf(req.getDifficulty()));
        }
        row.setSurvivedSec(req.getSurvivedSec() == null ? 0d : req.getSurvivedSec());
        row.setKills(req.getKills() == null ? 0 : req.getKills());
        row.setPlayerLevel(req.getLevel() == null ? 1 : req.getLevel());
        row.setExp(req.getExp() == null ? 0 : req.getExp());
        row.setEndedAt(LocalDateTime.now());
    }

    private static String difficultyOf(String raw) {
        return raw == null || raw.isBlank() ? "1" : raw.trim();
    }
}
