# import asyncio
# import sys

# def stdin_generator():
#     while True:
#         line = sys.stdin.readline()
#         if not line:
#             break
#         yield line

# for line in stdin_generator():
#     print(line)

import asyncio
import streamlit as st
import time
import aiofiles
import json
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import glob
import os
from PIL import Image

st.set_page_config(layout="wide")

buffer = []
transform_data = pd.DataFrame(columns=['ticks', 'object', 'x', 'y', 'z', 'rx', 'ry', 'rz', 'rw', 'angular_velocity_x', 'angular_velocity_y', 'angular_velocity_z', 'distance'])
background_img = Image.open("top_view.png")
prev_metric_values = {"distance": 0, "angular_velocity_x": 0, "angular_velocity_y": 0, "angular_velocity_z": 0}

def process_message(message):
    for line in message.splitlines():
        json_data = json.loads(line)
        if json_data['event'].startswith('transform'):
            transform_row = []
            transform_row.append(int(json_data['ticks']))
            transform_row.append(json_data['event'].split('transform_')[1])
            transform_row += list(json_data['arg1']['position'].values())
            transform_row += list(json_data['arg1']['rotation'].values())
            transform_row += list(json_data['arg1']['angularVelocity'].values())
            buffer.append(transform_row)


async def calculate_transform_metrics(m1, m2, m3, m4, m5):
    global buffer, transform_data, prev_metric_values
    df = pd.DataFrame(buffer, columns=['ticks', 'object', 'x', 'y', 'z', 'rx', 'ry', 'rz', 'rw', 'angular_velocity_x', 'angular_velocity_y', 'angular_velocity_z'])
    df['distance'] = df.groupby('object')['x'].diff().pow(2).add(df.groupby('object')['y'].diff().pow(2)).add(df.groupby('object')['z'].diff().pow(2)).pow(0.5)
    transform_data = pd.concat([transform_data, df])
    buffer = []

    metric_values = {
        "distance": round(transform_data['distance'].sum(), 2),
        "angular_velocity_x": round(transform_data['angular_velocity_x'].tail(50).mean(), 2),
        "angular_velocity_y": round(transform_data['angular_velocity_y'].tail(50).mean(), 2),
        "angular_velocity_z": round(transform_data['angular_velocity_z'].tail(50).mean(), 2),
    }

    # diff_metric_values = {
    #     "distance": round(metric_values['distance'] - prev_metric_values['distance'], 2),
    #     "angular_velocity_x": round(metric_values['angular_velocity_x'] - prev_metric_values['angular_velocity_x'], 2),
    #     "angular_velocity_y": round(metric_values['angular_velocity_y'] - prev_metric_values['angular_velocity_y'], 2),
    #     "angular_velocity_z": round(metric_values['angular_velocity_z'] - prev_metric_values['angular_velocity_z'], 2),
    # }

    m1.metric(
        label="Currenty holding",
        value="Firework",
        delta=None,
    )

    m2.metric(
        label="Distance traveled",
        value=str(metric_values['distance']) + "m",
        delta=None,
    )

    m3.metric(
        label="Angular velocity X (mean last 10s)",
        value=metric_values['angular_velocity_x'],
        delta=None,
    )

    m4.metric(
        label="Angular velocity Y (mean last 10s)",
        value=metric_values['angular_velocity_y'],
        delta=None,
    )

    m5.metric(
        label="Angular velocity Z (mean last 10s)",
        value=metric_values['angular_velocity_z'],
        delta=None,
    )

    prev_metric_values = metric_values


async def plot_metrics(p1, p2):
    global transform_data
    movement_fig = px.line(
        transform_data,
        x="x",
        y="z",
        title="Movement",
    )
    # Add rectangle to figure
    movement_fig.add_shape(
        type="rect",
        x0=-5,
        y0=-5,
        x1=5,
        y1=5,
        line_color=None,
        fillcolor='rgba(0, 0, 0, 0)',
    )

    movement_fig.add_layout_image(
        dict(
            source=background_img,
            xref="x",
            yref="y",
            x=-5,
            y=5,
            sizex=10,
            sizey=10,
            sizing="stretch",
            opacity=0.5,
            layer="below")
    )

    movement_fig.update_layout(height=500, width=500, showlegend=False)
    
    p1.plotly_chart(movement_fig, use_container_width=False)

    last_500 = transform_data.tail(500)
    angular_velocity_fig = go.Figure()
    angular_velocity_fig.add_trace(go.Scatter(x=last_500['ticks'], y=last_500['angular_velocity_x'], name='X'))
    angular_velocity_fig.add_trace(go.Scatter(x=last_500['ticks'], y=last_500['angular_velocity_y'], name='Y'))
    angular_velocity_fig.add_trace(go.Scatter(x=last_500['ticks'], y=last_500['angular_velocity_z'], name='Z'))

    # angular_velocity_fig.update_layout(showlegend=True)
    angular_velocity_fig.update_layout(height=500, width=500, showlegend=False, title="Mean angular head velocity (last 10s)")

    # Hide axes
    angular_velocity_fig.update_xaxes(showgrid=True, visible=False)
    # angular_velocity_fig.update_yaxes(showgrid=True, visible=False)

    p2.plotly_chart(angular_velocity_fig, use_container_width=True)


async def calculate_metrics():
    # st.success("Live")
    # show_live_badge(placeholder)
    m1, m2, m3, m4, m5 = st.columns(5)
    st.markdown("""<hr style="height:2px;border:none;color:#333;background-color:#333;" /> """, unsafe_allow_html=True)
    p1, p2 = st.columns(2)
    await calculate_transform_metrics(m1, m2, m3, m4, m5)
    await plot_metrics(p1, p2)
    # await calculate_angular_velocity(m2)
    

async def show_live_badge(file_name):
    left, right = st.columns(2)
    left.header("Statistics")
    # list_of_files = glob.glob('../logs/active/*.log.json')
    # st.selectbox("Select user", list_of_files, key=time.time())
    if os.path.exists(file_name):
        if os.path.getmtime(file_name) > time.time() - 5:
            return
    right.markdown("<h2 style='text-align: right; color: red;'>• Live</h2>", unsafe_allow_html=True)
    # right.markdown("<h2 style='text-align: right; color: dodgerblue;'>↺ Replay</h2>", unsafe_allow_html=True)
        

async def consumer(placeholder):
    list_of_files = glob.glob('../logs/active/*.log.json')
    latest_file = max(list_of_files, key=os.path.getctime)
    print("Listening to " + latest_file)
    async with aiofiles.open(latest_file, mode='r') as f:
        counter = 0
        while True:
            line = await f.readline()
            if not line or line.isspace():
                time.sleep(0.1)
                continue
            else:
                process_message(line)
                counter += 1
                if (counter > 5):
                    with placeholder.container():
                        await show_live_badge(latest_file)
                        await calculate_metrics()
                    counter = 0

container = st.empty()
asyncio.run(consumer(container))
