import React from 'react';
import { useState } from 'react';
import TestComponent3 from './TestComponent3';

interface TestComponentProps {
  message: string;
}

const TestComponent3: React.FC<TestComponentProps> = ({ message }) => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>{message}</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};

TestComponent3.displayName = "TestComponent3";

export default TestComponent3;
