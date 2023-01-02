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
from datetime import datetime
import time
import sys
import aiofiles
import json
import pandas as pd
import plotly.express as px

st.set_page_config(layout="wide")

# st.markdown(
#     """
#     <style>
#     .time {
#         font-size: 130px !important;
#         font-weight: 700 !important;
#         color: #ec5953 !important;
#     }
#     </style>
#     """,
#     unsafe_allow_html=True
# )

buffer = []
all_data = pd.DataFrame(columns=['ticks', 'object', 'x', 'y', 'z', 'rx', 'ry', 'rz', 'rw'])

def process_message(message):
    for line in message.splitlines():
        json_data = json.loads(line)
        if json_data['event'].startswith('transform'):
            transform_row = []
            transform_row.append(int(json_data['ticks']))
            transform_row.append(json_data['event'].split('transform_')[1])
            transform_row += list(json_data['arg1']['position'].values())
            transform_row += list(json_data['arg1']['rotation'].values())
            buffer.append(transform_row)


async def calculate_distance_travelled(test):
    global buffer, all_data
    df = pd.DataFrame(buffer, columns=['ticks', 'object', 'x', 'y', 'z', 'rx', 'ry', 'rz', 'rw'])
    df['distance'] = df.groupby('object')['x'].diff().pow(2).add(df.groupby('object')['y'].diff().pow(2)).add(df.groupby('object')['z'].diff().pow(2)).pow(0.5)
    all_data = pd.concat([all_data, df])
    buffer = []
    # print(df.tail(5))
    # Write sum of distance to test
    # test.write("Distance travelled: " + ))
    with test.container():
        kpi1, kpi2, kpi3 = st.columns(3)
        kpi1.metric(
            label="Distance Traveled",
            value=str(round(all_data['distance'].sum(), 2)) + "m",
            delta=0,
        )
        
        kpi2.metric(
            label="Head Rotation Velocity (avg. in last 10s)",
            value=0,
            delta=0,
        )
        
        kpi3.metric(
            label="Looking at...",
            value="Firework",
            delta=0,
        )

        plot1, plot2, plot3 = st.columns(3)
        fig = px.line(
            all_data,
            x="x",
            y="z",
        )
        # Add rectangle to figure
        fig.add_shape(
            type="rect",
            x0=-5,
            y0=-5,
            x1=5,
            y1=5,
            line_color="Red",
            fillcolor='rgba(122, 0, 0, 0.1)',
        )

        plot1.plotly_chart(fig, use_container_width=True)

async def consumer(test):
    async with aiofiles.open('../logs/active/6e3614de-0654-4601-9873-27f291a54bfa.log.json', mode='r') as f:
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
                    await calculate_distance_travelled(test)
                    counter = 0
                # full_data.append(line)
                # test.write(full_data)

st.title("Remote Analytics")
test = st.empty()

if st.button("Click me."):
    st.image("https://cdn11.bigcommerce.com/s-7va6f0fjxr/images/stencil/1280x1280/products/40655/56894/Jdm-Decals-Like-A-Boss-Meme-Jdm-Decal-Sticker-Vinyl-Decal-Sticker__31547.1506197439.jpg?c=2", width=200)

# if st.button("Click me."):
#     st.image("https://cdn11.bigcommerce.com/s-7va6f0fjxr/images/stencil/1280x1280/products/40655/56894/Jdm-Decals-Like-A-Boss-Meme-Jdm-Decal-Sticker-Vinyl-Decal-Sticker__31547.1506197439.jpg?c=2", width=200)

asyncio.run(consumer(test))
