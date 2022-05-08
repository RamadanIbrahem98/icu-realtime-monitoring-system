import numpy as np
import matplotlib.pyplot as plt
from opensignalsreader import OpenSignalsReader

file_names = [
  'opensignals_CC78AB62C78F_2022-04-28_13-11-14.txt',
  'opensignals_CC78AB62C78F_2022-04-28_13-12-57.txt',
  'opensignals_CC78AB62C78F_2022-04-28_13-14-21.txt',
  'opensignals_CC78AB62C78F_2022-04-28_13-15-46.txt',
  'opensignals_CC78AB62C78F_2022-04-28_13-17-16.txt',
  'opensignals_CC78AB62C78F_2022-04-28_13-18-48.txt',
  'opensignals_CC78AB62C78F_2022-04-28_13-20-22.txt'
  ]

plt.figure(figsize=(15, 12))
plt.subplots_adjust(hspace=0.5)
plt.suptitle("Detected Peaks in Files", fontsize=18, y=0.95)

for i, file_name in enumerate(file_names):
  opensignals = OpenSignalsReader(f'data/{file_name}')

  window_size = int(0.75 * opensignals.sampling_rate)

  mov_avg = np.convolve(opensignals._raw_signals['RAW'], np.ones(window_size), 'valid') / window_size
  avg_hr = (np.mean(opensignals._raw_signals['RAW']))
  mov_avg = np.array([avg_hr if np.isnan(x) else x for x in mov_avg])
  mov_avg = mov_avg * 1.25

  window = []
  peaklist = []
  listpos = 0

  for datapoint in opensignals._raw_signals['RAW']:
    if listpos >= len(mov_avg):
      break
    rollingmean = mov_avg[listpos]
    if (datapoint < rollingmean) and (len(window) < 1):
        listpos += 1
    elif (datapoint > rollingmean):
        window.append(datapoint)
        listpos += 1
    else:
        maximum = np.max(window)
        beatposition = listpos - len(window) + (window.index(np.max(window)))
        peaklist.append(beatposition)
        window = []
        listpos += 1

  ybeat = [opensignals._raw_signals['RAW'][x] for x in peaklist]

  RR_list = []
  cnt = 0

  while (cnt < (len(peaklist)-1)):
      RR_interval = (peaklist[cnt+1] - peaklist[cnt])
      ms_dist = ((RR_interval / opensignals.sampling_rate) * 1000.0)
      RR_list.append(ms_dist)
      cnt += 1

  bpm = 60000 / np.mean(RR_list)

  ax = plt.subplot(4, 2, i + 1)
  ax.set_title(f"{file_name}")
  ax.set_xlim(0,2500)
  ax.plot(opensignals._raw_signals['RAW'], alpha=0.5, color='blue', label="raw signal")
  ax.plot(mov_avg, color ='green', label="moving average")
  ax.scatter(peaklist, ybeat, color='red', label="average: %.1f BPM" %bpm)
  ax.legend(loc=4, framealpha=0.6)
plt.show()
