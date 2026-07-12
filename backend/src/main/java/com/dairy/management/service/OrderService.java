package com.dairy.management.service;

import com.dairy.management.dto.*;
import com.dairy.management.entity.*;
import com.dairy.management.exception.ApiException;
import com.dairy.management.repository.OrderRepository;
import com.dairy.management.repository.ProductRepository;
import com.dairy.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository  userRepository;
    private final ProductRepository productRepository;

    /* ── Customer: Place Order ──────────────────────── */

    @Transactional
    public OrderResponse placeOrder(Long userId, PlaceOrderRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        return createOrder(user, req.getDeliveryName(), req.getDeliveryPhone(),
                req.getDeliveryAddress(), req.getDeliveryCity(), req.getDeliveryPincode(),
                req.getNotes(), "COD", req.getItems());
    }

    /* Admin: create an order on behalf of a registered customer. */

    @Transactional
    public OrderResponse createOrderAdmin(AdminCreateOrderRequest req) {
        User customer = userRepository.findById(req.getCustomerId())
                .orElseThrow(() -> new ApiException("Customer not found", HttpStatus.NOT_FOUND));

        if (!"CUSTOMER".equals(customer.getRole())) {
            throw new ApiException("Orders can only be created for customer accounts", HttpStatus.BAD_REQUEST);
        }
        if (!customer.isActive()) {
            throw new ApiException("Cannot create an order for an inactive customer", HttpStatus.BAD_REQUEST);
        }

        return createOrder(customer, req.getDeliveryName(), req.getDeliveryPhone(),
                req.getDeliveryAddress(), req.getDeliveryCity(), req.getDeliveryPincode(),
                req.getNotes(), req.getPaymentMethod(), req.getItems());
    }

    private OrderResponse createOrder(
            User user,
            String deliveryName,
            String deliveryPhone,
            String deliveryAddress,
            String deliveryCity,
            String deliveryPincode,
            String notes,
            String paymentMethod,
            List<OrderItemRequest> requestedItems
    ) {
        if (requestedItems == null || requestedItems.isEmpty()) {
            throw new ApiException("Order must have at least one item", HttpStatus.BAD_REQUEST);
        }

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .user(user)
                .status(OrderStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .deliveryName(deliveryName.trim())
                .deliveryPhone(deliveryPhone.trim())
                .deliveryAddress(deliveryAddress.trim())
                .deliveryCity(trimToNull(deliveryCity))
                .deliveryPincode(trimToNull(deliveryPincode))
                .notes(trimToNull(notes))
                .paymentMethod(paymentMethod != null && !paymentMethod.isBlank() ? paymentMethod.toUpperCase() : "COD")
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequest ir : requestedItems) {
            if (ir.getProductId() == null || ir.getQuantity() == null || ir.getQuantity() < 1) {
                throw new ApiException("Each order item requires a product and quantity of at least 1", HttpStatus.BAD_REQUEST);
            }

            Product product = productRepository.findById(ir.getProductId())
                    .orElseThrow(() -> new ApiException("Product not found: " + ir.getProductId(), HttpStatus.NOT_FOUND));
            if (!product.isAvailable()) {
                throw new ApiException(product.getName() + " is currently unavailable", HttpStatus.BAD_REQUEST);
            }
            if (product.getStock() != null && ir.getQuantity() > product.getStock()) {
                throw new ApiException("Only " + product.getStock() + " units of " + product.getName() + " are available", HttpStatus.BAD_REQUEST);
            }

            // Product identity and price always come from PostgreSQL, never from the browser payload.
            BigDecimal unitPrice = product.getPrice();
            BigDecimal subtotal  = unitPrice.multiply(BigDecimal.valueOf(ir.getQuantity()));
            total = total.add(subtotal);

            OrderItem item = OrderItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .productEmoji(product.getEmoji())
                    .productUnit(product.getUnit())
                    .quantity(ir.getQuantity())
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .build();

            item.setOrder(order);
            order.getItems().add(item);

            // Decrement stock
            if (product.getStock() != null) {
                product.setStock(Math.max(0, product.getStock() - ir.getQuantity()));
                productRepository.save(product);
            }
        }
        order.setTotalAmount(total);

        return toResponse(orderRepository.save(order));
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /* ── Customer: My Orders ────────────────────────── */

    public List<OrderResponse> getMyOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /* ── Customer: Order Detail ─────────────────────── */

    public OrderResponse getOrderById(Long orderId, Long userId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ApiException("Order not found", HttpStatus.NOT_FOUND));
        return toResponse(order);
    }

    /* ── Customer: Cancel Order ─────────────────────── */

    @Transactional
    public OrderResponse cancelOrder(Long orderId, Long userId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ApiException("Order not found", HttpStatus.NOT_FOUND));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ApiException("Only PENDING orders can be cancelled", HttpStatus.BAD_REQUEST);
        }
        order.setStatus(OrderStatus.CANCELLED);
        return toResponse(orderRepository.save(order));
    }

    /* ── Admin: All Orders ──────────────────────────── */

    public List<OrderResponse> getAllOrdersAdmin(String statusFilter) {
        if (statusFilter != null && !statusFilter.isBlank()) {
            OrderStatus status;
            try {
                status = OrderStatus.valueOf(statusFilter.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ApiException("Invalid status: " + statusFilter, HttpStatus.BAD_REQUEST);
            }
            return orderRepository.findByStatusOrderByCreatedAtDesc(status)
                    .stream().map(this::toResponse).toList();
        }
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    /* ── Admin: Order Detail (no user restriction) ─── */

    public OrderResponse getOrderByIdAdmin(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ApiException("Order not found", HttpStatus.NOT_FOUND));
        return toResponse(order);
    }

    /* ── Admin: Update Order Status ─────────────────── */

    @Transactional
    public OrderResponse adminUpdateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ApiException("Order not found", HttpStatus.NOT_FOUND));

        if (order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.CANCELLED) {
            throw new ApiException("Cannot change status of DELIVERED or CANCELLED orders", HttpStatus.BAD_REQUEST);
        }
        order.setStatus(newStatus);
        return toResponse(orderRepository.save(order));
    }

    /* ── Delivery: Pending deliveries ───────────────── */

    public List<OrderResponse> getPendingForDelivery() {
        return orderRepository.findByStatusOrderByCreatedAtDesc(OrderStatus.OUT_FOR_DELIVERY)
                .stream().map(this::toResponse).toList();
    }

    /* ── Delivery: Mark as delivered ─────────────────── */

    @Transactional
    public OrderResponse markAsDelivered(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ApiException("Order not found", HttpStatus.NOT_FOUND));
        if (order.getStatus() != OrderStatus.OUT_FOR_DELIVERY) {
            throw new ApiException("Only OUT_FOR_DELIVERY orders can be marked delivered", HttpStatus.BAD_REQUEST);
        }
        order.setStatus(OrderStatus.DELIVERED);
        return toResponse(orderRepository.save(order));
    }

    /* ── Delivery: History ────────────────────────────── */

    public List<OrderResponse> getDeliveryHistory() {
        return orderRepository.findByStatusOrderByCreatedAtDesc(OrderStatus.DELIVERED)
                .stream().map(this::toResponse).toList();
    }

    /* ── Helpers ─────────────────────────────────────── */

    private String generateOrderNumber() {
        String date   = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "DF-" + date + "-";
        long   count  = orderRepository.count() + 1;
        String number = prefix + String.format("%05d", count);
        while (orderRepository.existsByOrderNumber(number)) {
            count++;
            number = prefix + String.format("%05d", count);
        }
        return number;
    }

    OrderResponse toResponse(Order o) {
        List<OrderItemResponse> items = o.getItems().stream()
                .map(i -> OrderItemResponse.builder()
                        .id(i.getId())
                        .productId(i.getProductId())
                        .productName(i.getProductName())
                        .productEmoji(i.getProductEmoji())
                        .productUnit(i.getProductUnit())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .subtotal(i.getSubtotal())
                        .build())
                .toList();

        return OrderResponse.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .status(o.getStatus())
                .totalAmount(o.getTotalAmount())
                .deliveryName(o.getDeliveryName())
                .deliveryPhone(o.getDeliveryPhone())
                .deliveryAddress(o.getDeliveryAddress())
                .deliveryCity(o.getDeliveryCity())
                .deliveryPincode(o.getDeliveryPincode())
                .notes(o.getNotes())
                .paymentMethod(o.getPaymentMethod())
                .items(items)
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .build();
    }
}
