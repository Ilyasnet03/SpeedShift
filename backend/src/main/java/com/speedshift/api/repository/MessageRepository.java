package com.speedshift.api.repository;

import com.speedshift.api.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdOrderByIdAsc(Long conversationId);

    Message findFirstByConversationIdOrderByIdDesc(Long conversationId);

    @Modifying
    @Query("update Message m set m.readAt = :now where m.conversationId = :conversationId and m.senderId <> :userId and m.readAt is null")
    void markRead(@Param("conversationId") Long conversationId, @Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Query("select m.conversationId, count(m) from Message m where m.conversationId in :ids and m.senderId <> :userId and m.readAt is null group by m.conversationId")
    List<Object[]> unreadByConversation(@Param("ids") Collection<Long> ids, @Param("userId") Long userId);
}
