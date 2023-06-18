#!/usr/bin/env python3

import http.server
import socketserver
import json
import time
import psutil

# The port number of the local HTTP server, which can be modified
PORT = 8288

# Global variables to store the previous network stats and the last update time
prev_net_io = psutil.net_io_counters()
last_update_time = time.time()

class RequestHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        global prev_net_io, last_update_time

        current_time = time.time()
        current_net_io = psutil.net_io_counters()

        # Compute the send and receive rates if at least 30 seconds have passed since the last update
        if current_time - last_update_time >= 30:
            time_interval = current_time - last_update_time
            send_rate = (current_net_io.bytes_sent - prev_net_io.bytes_sent) / time_interval / (1024*1024) * 8
            recv_rate = (current_net_io.bytes_recv - prev_net_io.bytes_recv) / time_interval / (1024*1024) * 8

            # Update the previous network stats and the last update time
            prev_net_io = current_net_io
            last_update_time = current_time
        else:
            send_rate = None
            recv_rate = None

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

        # Get the last statistics time
        last_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())

        # Find the process with maximum memory usage
        max_mem_process = None
        for proc in psutil.process_iter(['pid', 'name', 'memory_percent']):
            if max_mem_process is None or proc.info['memory_percent'] > max_mem_process.info['memory_percent']:
                max_mem_process = proc

        # Construct JSON dictionary
        response_dict = {
            "utc_timestamp": int(time.time()),
            "uptime": int(time.time() - psutil.boot_time()),
            "cpu_usage": psutil.cpu_percent(),
            "mem_usage": psutil.virtual_memory().percent,
            "bytes_sent": str(psutil.net_io_counters().bytes_sent),
            "bytes_recv": str(psutil.net_io_counters().bytes_recv),
            "bytes_total": str(psutil.net_io_counters().bytes_sent + psutil.net_io_counters().bytes_recv),
            "last_time": last_time,
            "max_mem_process_pid": max_mem_process.info['pid'],
            "max_mem_process_name": max_mem_process.info['name'],
            "max_mem_process_usage": max_mem_process.info['memory_percent'],
            "send_rate": send_rate,  # Add send_rate to the response dictionary
            "recv_rate": recv_rate   # Add recv_rate to the response dictionary
        }

        # Convert JSON dictionary to JSON string
        response_json = json.dumps(response_dict).encode('utf-8')
        self.wfile.write(response_json)

with socketserver.ThreadingTCPServer(("", PORT), RequestHandler) as httpd:
    try:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("KeyboardInterrupt is captured, program exited")
