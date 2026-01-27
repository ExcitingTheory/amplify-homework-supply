import React from 'react';
import { useState } from 'react';
import TestComponent from './TestComponent';

interface TestComponentProps {
  message: string;
}

const TestComponent: React.FC<TestComponentProps> = ({ message }) => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>{message}</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};

TestComponent.displayName = "TestComponent";

export default TestComponent;
