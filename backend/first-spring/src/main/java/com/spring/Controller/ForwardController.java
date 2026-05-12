package com.spring.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ForwardController {

    @GetMapping(value = "/{path:[^\\.]*}")
    public String redirect(){
        return "forward:/";
    }
}
