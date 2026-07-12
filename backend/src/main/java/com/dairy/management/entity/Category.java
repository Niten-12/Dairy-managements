package com.dairy.management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "categories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String emoji;

    private String description;

    @Column(name = "bg_color")
    private String bgColor;

    @Column(name = "ring_color")
    private String ringColor;

    @Column(nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    private List<Product> products;
}
