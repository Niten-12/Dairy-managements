package com.dairy.management.service;

import com.dairy.management.dto.FarmerStatsResponse;
import com.dairy.management.dto.MilkCollectionRequest;
import com.dairy.management.dto.MilkCollectionResponse;
import com.dairy.management.entity.MilkCollection;
import com.dairy.management.entity.User;
import com.dairy.management.exception.ApiException;
import com.dairy.management.repository.MilkCollectionRepository;
import com.dairy.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FarmerService {

    private final MilkCollectionRepository milkRepo;
    private final UserRepository userRepository;

    @Transactional
    public MilkCollectionResponse addEntry(Long farmerId, MilkCollectionRequest req) {
        User farmer = userRepository.findById(farmerId)
                .orElseThrow(() -> new ApiException("Farmer not found", HttpStatus.NOT_FOUND));

        MilkCollection entry = MilkCollection.builder()
                .farmer(farmer)
                .collectionDate(req.getCollectionDate())
                .session(req.getSession())
                .quantityLitres(req.getQuantityLitres())
                .fatPercentage(req.getFatPercentage())
                .notes(req.getNotes())
                .build();

        return toResponse(milkRepo.save(entry));
    }

    public List<MilkCollectionResponse> getMyEntries(Long farmerId) {
        return milkRepo.findByFarmerIdOrderByCollectionDateDescCreatedAtDesc(farmerId)
                .stream().map(this::toResponse).toList();
    }

    public FarmerStatsResponse getStats(Long farmerId) {
        LocalDate today      = LocalDate.now();
        LocalDate weekStart  = today.minusDays(6);
        LocalDate monthStart = today.withDayOfMonth(1);

        return FarmerStatsResponse.builder()
                .todayLitres(milkRepo.sumByFarmerAndDate(farmerId, today))
                .weekLitres(milkRepo.sumByFarmerSince(farmerId, weekStart))
                .monthLitres(milkRepo.sumByFarmerSince(farmerId, monthStart))
                .avgFatPercent(milkRepo.avgFatByFarmerSince(farmerId, monthStart))
                .monthEntryCount(milkRepo.countByFarmerSince(farmerId, monthStart))
                .build();
    }

    private MilkCollectionResponse toResponse(MilkCollection m) {
        return MilkCollectionResponse.builder()
                .id(m.getId())
                .collectionDate(m.getCollectionDate())
                .session(m.getSession())
                .quantityLitres(m.getQuantityLitres())
                .fatPercentage(m.getFatPercentage())
                .notes(m.getNotes())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
