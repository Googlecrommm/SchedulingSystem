import React, { useContext } from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import axios from 'axios';



function Dashboard() { 
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8080/Departments/getDepartments')
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      {data.map((dept) => (
        <div key={dept.departmentId}>
          {dept.departmentId} - {dept.departmentName}
        </div>
      ))}

    </div>
    
  );
}

export default Dashboard;

