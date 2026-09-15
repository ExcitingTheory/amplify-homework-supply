export const BUILT_IN_TIMING_PATTERNS = [
  {
    id: "class-start",
    name: "Start of class",
    availableFromAnchor: "CLASS_START",
    availableFromOffsetMinutes: 0,
    availableUntilAnchor: "END_OF_DAY",
    availableUntilOffsetMinutes: 0,
    allowLateCompletion: true,
  },
  {
    id: "class-end",
    name: "End of class",
    availableFromAnchor: "CLASS_END",
    availableFromOffsetMinutes: 0,
    availableUntilAnchor: "END_OF_DAY",
    availableUntilOffsetMinutes: 0,
    allowLateCompletion: true,
  },
  {
    id: "end-of-day",
    name: "Due 11:59 PM",
    availableFromAnchor: "CLASS_START",
    availableFromOffsetMinutes: 0,
    availableUntilAnchor: "END_OF_DAY",
    availableUntilOffsetMinutes: 0,
    allowLateCompletion: true,
  },
  {
    id: "end-of-week",
    name: "End of week",
    availableFromAnchor: "CLASS_START",
    availableFromOffsetMinutes: 0,
    availableUntilAnchor: "END_OF_WEEK",
    availableUntilOffsetMinutes: 0,
    allowLateCompletion: true,
  },
];

function toDateParts(date) {
  const value = new Date(date);
  return {
    year: value.getFullYear(),
    month: value.getMonth(),
    date: value.getDate(),
    hours: value.getHours(),
    minutes: value.getMinutes(),
    seconds: value.getSeconds(),
    ms: value.getMilliseconds(),
  };
}

function getMeetingTimeInfo(meetingDate, classSchedule = []) {
  if (
    !meetingDate ||
    !Array.isArray(classSchedule) ||
    classSchedule.length === 0
  ) {
    return {
      start: new Date(meetingDate),
      end: new Date(meetingDate),
    };
  }

  const target = new Date(meetingDate);
  const schedule = [...classSchedule]
    .filter((entry) => entry && entry.startTime)
    .sort((a, b) => Number(a.dayOfWeek ?? 0) - Number(b.dayOfWeek ?? 0));

  const matching =
    schedule.find((entry) => {
      const day = new Date(target);
      return day.getDay() === Number(entry.dayOfWeek ?? 0);
    }) || schedule[0];

  if (!matching) {
    return {
      start: new Date(target),
      end: new Date(target),
    };
  }

  const toTime = (timeText) => {
    if (!timeText || typeof timeText !== "string") return 0;
    const [hours, minutes = "0"] = timeText.split(":").map(Number);
    return (
      (Number.isFinite(hours) ? hours : 0) * 60 +
      (Number.isFinite(minutes) ? minutes : 0)
    );
  };

  const start = new Date(target);
  const end = new Date(target);
  const startMinutes = toTime(matching.startTime);
  const endMinutes = toTime(matching.endTime || matching.startTime);
  start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  end.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
  return { start, end };
}

export function resolveTimingWindow(pattern, meetingDate, classSchedule = []) {
  const source = pattern || BUILT_IN_TIMING_PATTERNS[0];
  const meeting = new Date(meetingDate || new Date());
  const scheduleInfo = getMeetingTimeInfo(meeting, classSchedule);

  const start = new Date(meeting);
  const end = new Date(meeting);

  if (source.availableFromAnchor === "CLASS_START") {
    const from = new Date(scheduleInfo.start);
    from.setMinutes(
      from.getMinutes() + (source.availableFromOffsetMinutes || 0),
    );
    start.setTime(from.getTime());
  } else if (source.availableFromAnchor === "CLASS_END") {
    const from = new Date(scheduleInfo.end);
    from.setMinutes(
      from.getMinutes() + (source.availableFromOffsetMinutes || 0),
    );
    start.setTime(from.getTime());
  }

  if (source.availableUntilAnchor === "CLASS_END") {
    const until = new Date(scheduleInfo.end);
    until.setMinutes(
      until.getMinutes() + (source.availableUntilOffsetMinutes || 0),
    );
    end.setTime(until.getTime());
  } else if (source.availableUntilAnchor === "END_OF_DAY") {
    const until = new Date(meeting);
    until.setHours(23, 59, 59, 999);
    until.setMinutes(
      until.getMinutes() + (source.availableUntilOffsetMinutes || 0),
    );
    end.setTime(until.getTime());
  } else if (source.availableUntilAnchor === "END_OF_WEEK") {
    const until = new Date(meeting);
    const day = until.getDay();
    const daysUntilSunday = (7 - day) % 7;
    until.setDate(until.getDate() + daysUntilSunday);
    until.setHours(23, 59, 59, 999);
    until.setMinutes(
      until.getMinutes() + (source.availableUntilOffsetMinutes || 0),
    );
    end.setTime(until.getTime());
  }

  return {
    availableFrom: start,
    availableUntil: end,
    allowLateCompletion: source.allowLateCompletion !== false,
  };
}

export function shouldFlagLateSubmission(assignment = {}) {
  if (!assignment) return false;
  if (assignment.lateStatus === "DROPPED" || assignment.lateStatus === "KEPT") {
    return false;
  }
  if (assignment.allowLateCompletion === false) {
    return false;
  }

  const availableUntil = assignment.availableUntil
    ? new Date(assignment.availableUntil)
    : assignment.dueDate
      ? new Date(assignment.dueDate)
      : null;

  if (!availableUntil) return false;
  return new Date() > availableUntil;
}

export function getAssignmentWindowState(assignment = {}) {
  const now = new Date();
  const lateStatus = assignment.lateStatus || assignment.status;
  const availableFrom = assignment.availableFrom
    ? new Date(assignment.availableFrom)
    : assignment.unlockDate
      ? new Date(assignment.unlockDate)
      : null;
  const availableUntil = assignment.availableUntil
    ? new Date(assignment.availableUntil)
    : assignment.dueDate
      ? new Date(assignment.dueDate)
      : null;

  if (!availableFrom && !availableUntil) {
    return { state: "open", isOpen: true, isLate: false, isLocked: false };
  }

  if (lateStatus === "DROPPED") {
    return {
      state: "closed",
      isOpen: false,
      isLate: false,
      isLocked: true,
      closesAt: availableUntil,
      lateStatus,
    };
  }

  const lockOpen = availableFrom && now < availableFrom;
  const isLate = Boolean(
    availableUntil &&
    now > availableUntil &&
    assignment.allowLateCompletion !== false &&
    lateStatus !== "DROPPED",
  );

  if (lockOpen) {
    return {
      state: "locked",
      isOpen: false,
      isLate: false,
      isLocked: true,
      opensAt: availableFrom,
    };
  }

  if (availableUntil && now > availableUntil) {
    if (assignment.allowLateCompletion === false) {
      return {
        state: "closed",
        isOpen: false,
        isLate: false,
        isLocked: true,
        closesAt: availableUntil,
      };
    }

    return {
      state: "late",
      isOpen: true,
      isLate: true,
      isLocked: false,
      closesAt: availableUntil,
    };
  }

  return {
    state: "open",
    isOpen: true,
    isLate: false,
    isLocked: false,
    opensAt: availableFrom,
    closesAt: availableUntil,
  };
}
