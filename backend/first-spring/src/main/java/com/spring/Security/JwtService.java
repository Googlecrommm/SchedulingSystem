package com.spring.Security;

import com.spring.Models.Users;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Date;

@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long expiration;

    private Key getSigningKey(){
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private Date extractExpiration(String token){
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
    }

    public String generateToken(Users user){
        String fullName = user.getLastName() + ", " + user.getFirstName() + " "
                + (user.getMiddleName() == null ? "" : user.getMiddleName());

        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("role", user.getAuthorities())
                .claim("name", fullName)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractEmail(String token){
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String extractName(String token){
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("name", String.class);
    }

    public boolean validateToken(String token, String email){
        return extractEmail(token).equals(email) && extractExpiration(token).after(new Date());
    }

}
