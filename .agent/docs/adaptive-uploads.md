# Dynamic Adaptive Upload System

## Overview
The upload system features a **truly dynamic adaptive concurrency system** that continuously monitors performance and adjusts the number of concurrent uploads in real-time.

## Key Features

### 🎯 Dynamic Doubling Strategy
- **Starts with 1 upload** to establish baseline
- **Doubles concurrency**: 1 → 2 → 4 → 8 (when performance is good)
- **Halves concurrency**: 8 → 4 → 2 → 1 (when performance drops)
- **Continuous monitoring**: Adjusts every 10 seconds

### 📊 Intelligent Performance Tracking

#### Sliding Window Analysis (10 seconds)
- Tracks recent uploads within a 10-second window
- Automatically discards old data outside the window
- Provides real-time performance metrics

#### File-Size Aware Metrics
- **Weighted average speed**: Larger files have more weight in calculations
- **Throughput calculation**: Total bytes / total time for accurate measurement
- **Dynamic thresholds**: 
  - Small files (< 50 KB): 50 KB/s threshold
  - Large files (> 200 KB): 200 KB/s threshold
  - Scales linearly between these values

### 🔄 Continuous Adjustment Logic

Every 10 seconds, the system:

1. **Analyzes recent performance** (last 10 seconds of uploads)
2. **Calculates metrics**:
   - Weighted average speed (accounts for file size)
   - Overall throughput
   - Average file size
   - Sample count

3. **Makes decisions**:
   - **Good performance** (throughput > threshold) → **Double** concurrency
   - **Poor performance** (throughput < 50% of threshold) → **Halve** concurrency
   - **Stable performance** → **Maintain** current level

### 📈 Example Progression

```
Time 0s:  Start with 1 upload
Time 3s:  First upload completes at 150 KB/s
Time 10s: Good performance detected → Double to 2
Time 15s: Both uploads complete at 180 KB/s avg
Time 20s: Still good → Double to 4
Time 30s: Performance stable at 200 KB/s → Double to 8
Time 40s: Performance drops to 80 KB/s → Halve to 4
Time 50s: Performance recovers → Back to 8
```

### 🎨 Real-time UI Feedback

The interface shows:
- **Current concurrency level**: "⚡ Uploading 3 file(s) • Concurrency: 4x"
- **Progress bars** with percentage for each file
- **Speed indicators**: Real-time KB/s for active uploads
- **File sizes**: Displayed for context
- **Success metrics**: Shows upload speed for completed files

### 🔍 Console Logging

Detailed performance logs in the browser console:

```
🚀 Doubling concurrency to 2 (exploring capacity)
📊 Metrics: Speed=150.23 KB/s, Throughput=145.67 KB/s, AvgSize=245.12 KB, Threshold=100.00 KB/s, Concurrency=2
📈 Doubling concurrency to 4 (good performance: 180.45 KB/s)
📊 Metrics: Speed=85.34 KB/s, Throughput=82.11 KB/s, AvgSize=180.45 KB, Threshold=100.00 KB/s, Concurrency=4
📉 Halving concurrency to 2 (poor performance: 82.11 KB/s)
➡️ Maintaining concurrency at 2 (stable performance)
```

### 🧮 Technical Implementation

#### Performance Metrics Calculation

```typescript
const getPerformanceMetrics = () => {
  const recentData = recentUploads.filter(u => 
    now - u.timestamp < 10000 // Last 10 seconds
  );
  
  // Weighted average (larger files = more weight)
  const totalSize = recentData.reduce((sum, u) => sum + u.fileSize, 0);
  const weightedSpeed = recentData.reduce((sum, u) => {
    const weight = u.fileSize / totalSize;
    return sum + (u.speed * weight);
  }, 0);
  
  // Throughput (total bytes / total time)
  const totalBytes = recentData.reduce((sum, u) => sum + u.fileSize, 0);
  const totalTime = recentData.reduce((sum, u) => sum + u.duration, 0);
  const throughput = (totalBytes / totalTime) * 1000;
  
  return { weightedSpeed, throughput, avgFileSize, sampleCount };
};
```

#### Dynamic Threshold Calculation

```typescript
// Adapts to file size
const baseThreshold = 50 * 1024; // 50 KB/s for small files
const maxThreshold = 200 * 1024; // 200 KB/s for large files
const sizeThreshold = Math.min(
  maxThreshold, 
  baseThreshold + (avgFileSize / 1024) * 1024
);
```

#### Adjustment Logic

```typescript
if (throughput > sizeThreshold && concurrency < 8) {
  concurrency = Math.min(8, concurrency * 2); // Double
} else if (throughput < sizeThreshold * 0.5 && concurrency > 1) {
  concurrency = Math.max(1, Math.floor(concurrency / 2)); // Halve
}
```

### 🎯 Benefits

1. **Handles Variable File Sizes**: Small files don't penalize the system
2. **Adapts to Network Conditions**: Automatically scales up/down
3. **Maximizes Throughput**: Finds optimal concurrency level
4. **Server-Friendly**: Won't overwhelm the server
5. **Self-Correcting**: Reduces concurrency if performance degrades

### 🚀 Usage

1. Navigate to `/site/uploads`
2. Drag and drop multiple files (mix of sizes works great)
3. Click "Upload"
4. Watch the system:
   - Start with 1 upload
   - Monitor the concurrency level increase
   - See real-time progress and speeds
   - Check console for detailed metrics

### 📝 Performance Data Tracked

For each upload:
- **File name**: Identifier
- **Speed**: Bytes per second
- **Duration**: Total upload time
- **File size**: In bytes
- **Timestamp**: When it completed

This data is used in a **sliding 10-second window** to make intelligent decisions.

### 🔮 Future Enhancements

Potential improvements:
- **Predictive scaling**: Use ML to predict optimal concurrency
- **Network quality detection**: Adjust based on latency/jitter
- **Bandwidth limits**: User-configurable max bandwidth
- **Priority queues**: Upload important files first
- **Resume capability**: Continue interrupted uploads
- **Chunked uploads**: For very large files
